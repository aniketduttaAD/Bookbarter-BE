import { Request, Response, NextFunction } from "express";
import { MessageModel } from "../models/message-model";
import { NotificationModel } from "../models/notification-model";
import { ApiError } from "../middleware/error-middleware";
import { z } from "zod";
import { FileOps } from "../utils/fileOps";
import { BookModel } from "../models/book-model";

const messageSchema = z.object({
    content: z.string().min(1, "Message cannot be empty").max(1000, "Message is too long"),
});

const threadSchema = z.object({
    recipientId: z.string().min(1, "Recipient ID is required"),
    bookId: z.string().optional(),
});

export const getThreads = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new ApiError(401, "Unauthorized");
        }

        const threads = MessageModel.getThreadsByUserId(userId);
        res.status(200).json(threads);
    } catch (error) {
        next(error);
    }
};

export const getThread = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new ApiError(401, "Unauthorized");
        }

        const { threadId } = req.params;
        const thread = MessageModel.getThreadById(threadId);

        if (!thread) {
            throw new ApiError(404, "Thread not found");
        }

        const isParticipant = thread.participants.some((p) => p.id === userId);
        if (!isParticipant) {
            throw new ApiError(403, "You don't have permission to access this thread");
        }

        const messages = MessageModel.getMessagesByThreadId(threadId);
        const lastMessage = messages.length > 0
            ? messages.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )[0]
            : undefined;

        const unreadCount = messages.filter(
            (message) => message.senderId !== userId && !message.read
        ).length;

        const fullThread = {
            ...thread,
            lastMessage,
            unreadCount,
        };

        res.status(200).json(fullThread);
    } catch (error) {
        next(error);
    }
};

export const getThreadMessages = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new ApiError(401, "Unauthorized");
        }

        const { threadId } = req.params;
        const thread = MessageModel.getThreadById(threadId);

        if (!thread) {
            throw new ApiError(404, "Thread not found");
        }

        const isParticipant = thread.participants.some((p) => p.id === userId);
        if (!isParticipant) {
            throw new ApiError(403, "You don't have permission to access this thread");
        }

        const messages = MessageModel.getMessagesByThreadId(threadId);
        res.status(200).json(messages);
    } catch (error) {
        next(error);
    }
};

export const createThread = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new ApiError(401, "Unauthorized");
        }

        const validatedData = threadSchema.parse(req.body);

        const users = FileOps.readJsonFile("data/users.json");
        const currentUser = users.find((u: any) => u.id === userId);
        const recipient = users.find((u: any) => u.id === validatedData.recipientId);

        if (!recipient) {
            throw new ApiError(404, "Recipient not found");
        }

        if (userId === validatedData.recipientId) {
            throw new ApiError(400, "Cannot create a thread with yourself");
        }

        const existingThread = MessageModel.getThreadBetweenUsers(
            [userId, validatedData.recipientId],
            validatedData.bookId
        );

        if (existingThread) {
            const messages = MessageModel.getMessagesByThreadId(existingThread.id);
            const lastMessage = messages.length > 0
                ? messages.sort((a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                )[0]
                : undefined;

            const unreadCount = messages.filter(
                (message) => message.senderId !== userId && !message.read
            ).length;

            res.status(200).json({
                ...existingThread,
                lastMessage,
                unreadCount,
            });
            return;
        }

        const thread = MessageModel.createThread(
            [
                { id: userId, name: (currentUser as { name: string }).name },
                { id: validatedData.recipientId, name: (recipient as { name: string }).name },
            ],
            validatedData.bookId
        );

        res.status(201).json(thread);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                message: "Validation error",
                errors: error.errors,
            });
            return;
        }
        next(error);
    }
};

export const getOrCreateThreadForBook = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new ApiError(401, "Unauthorized");
        }

        const { recipientId, bookId } = req.body;

        if (!recipientId || !bookId) {
            throw new ApiError(400, "Recipient ID and Book ID are required");
        }

        if (userId === recipientId) {
            throw new ApiError(400, "Cannot create a thread with yourself");
        }

        const users = FileOps.readJsonFile("data/users.json");
        const currentUser = users.find((u: any) => u.id === userId);
        const recipient = users.find((u: any) => u.id === recipientId);

        if (!recipient) {
            throw new ApiError(404, "Recipient not found");
        }

        const book = BookModel.getById(bookId);
        if (!book) {
            throw new ApiError(404, "Book not found");
        }

        const existingThread = MessageModel.getThreadBetweenUsers(
            [userId, recipientId],
            bookId
        );

        if (existingThread) {
            const messages = MessageModel.getMessagesByThreadId(existingThread.id);
            const lastMessage = messages.length > 0
                ? messages.sort((a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                )[0]
                : undefined;

            const unreadCount = messages.filter(
                (message) => message.senderId !== userId && !message.read
            ).length;

            res.status(200).json({
                ...existingThread,
                lastMessage,
                unreadCount,
            });
            return;
        }

        const thread = MessageModel.createThread(
            [
                { id: userId, name: (currentUser as { name: string }).name },
                { id: recipientId, name: (recipient as { name: string }).name },
            ],
            bookId
        );

        NotificationModel.create(recipientId, {
            title: "New Message Thread",
            message: `${(currentUser as { name: string }).name} wants to discuss ${book.title}`,
            type: "message_received",
            link: `/messages?thread=${thread.id}`,
        });

        res.status(201).json(thread);
    } catch (error) {
        next(error);
    }
};

export const sendMessage = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new ApiError(401, "Unauthorized");
        }

        const { threadId } = req.params;

        const validatedData = messageSchema.parse(req.body);

        const thread = MessageModel.getThreadById(threadId);
        if (!thread) {
            throw new ApiError(404, "Thread not found");
        }

        const isParticipant = thread.participants.some((p) => p.id === userId);
        if (!isParticipant) {
            throw new ApiError(403, "You don't have permission to send messages in this thread");
        }

        const message = MessageModel.sendMessage(threadId, userId, validatedData.content);

        const recipient = thread.participants.find((p) => p.id !== userId);
        if (recipient) {
            const sender = thread.participants.find((p) => p.id === userId);

            let notificationMessage = `${sender?.name || "Someone"} sent you a message`;
            let link = `/messages?thread=${threadId}`;

            if (thread.book) {
                notificationMessage += ` about "${thread.book.title}"`;
                link += `&book=${thread.book.id}`;
            }

            NotificationModel.create(recipient.id, {
                title: "New Message",
                message: notificationMessage,
                type: "message_received",
                link,
            });
        }

        res.status(201).json(message);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                message: "Validation error",
                errors: error.errors,
            });
            return;
        }
        next(error);
    }
};

export const markMessageAsRead = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new ApiError(401, "Unauthorized");
        }

        const { messageId } = req.params;

        const message = MessageModel.getMessageById(messageId);
        if (!message) {
            throw new ApiError(404, "Message not found");
        }

        const thread = MessageModel.getThreadById(message.threadId);
        if (!thread || !thread.participants.some((p) => p.id === userId)) {
            throw new ApiError(403, "You don't have permission to access this message");
        }

        if (message.senderId === userId) {
            throw new ApiError(400, "You cannot mark your own messages as read");
        }

        const success = MessageModel.markMessageAsRead(messageId);

        if (!success) {
            throw new ApiError(500, "Failed to mark message as read");
        }

        res.status(200).json({ message: "Message marked as read" });
    } catch (error) {
        next(error);
    }
};

export const markThreadAsRead = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new ApiError(401, "Unauthorized");
        }

        const { threadId } = req.params;

        const thread = MessageModel.getThreadById(threadId);
        if (!thread) {
            throw new ApiError(404, "Thread not found");
        }

        const isParticipant = thread.participants.some((p) => p.id === userId);
        if (!isParticipant) {
            throw new ApiError(403, "You don't have permission to access this thread");
        }

        const count = MessageModel.markThreadAsRead(threadId, userId);

        res.status(200).json({ count, message: `${count} messages marked as read` });
    } catch (error) {
        next(error);
    }
};

export const getUnreadCountForUser = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new ApiError(401, "Unauthorized");
        }

        const count = MessageModel.getUnreadCountForUser(userId);
        res.status(200).json({ count });
    } catch (error) {
        next(error);
    }
};
