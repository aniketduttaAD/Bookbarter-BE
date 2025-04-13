import { v4 as uuidv4 } from "uuid";
import { FileOps } from "../utils/fileOps";
import { Message, MessageThread } from "../types";
import { BookModel } from "./book-model";

const MESSAGES_FILE_PATH = "data/messages.json";
const THREADS_FILE_PATH = "data/message-threads.json";
const USERS_FILE_PATH = "data/users.json";

export const MessageModel = {
    getAllMessages: (): Message[] => {
        return FileOps.readJsonFile<Message>(MESSAGES_FILE_PATH);
    },

    getAllThreads: (): MessageThread[] => {
        return FileOps.readJsonFile<MessageThread>(THREADS_FILE_PATH);
    },

    getMessageById: (id: string): Message | null => {
        const messages = FileOps.readJsonFile<Message>(MESSAGES_FILE_PATH);
        return messages.find((message) => message.id === id) || null;
    },

    getMessagesByThreadId: (threadId: string): Message[] => {
        const messages = FileOps.readJsonFile<Message>(MESSAGES_FILE_PATH);
        return messages
            .filter((message) => message.threadId === threadId)
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    },

    getThreadById: (threadId: string): MessageThread | null => {
        const threads = FileOps.readJsonFile<MessageThread>(THREADS_FILE_PATH);
        return threads.find((thread) => thread.id === threadId) || null;
    },

    getThreadsByUserId: (userId: string): MessageThread[] => {
        const threads = FileOps.readJsonFile<MessageThread>(THREADS_FILE_PATH);
        const userThreads = threads.filter((thread) =>
            thread.participants.some((participant) => participant.id === userId)
        );

        const messages = FileOps.readJsonFile<Message>(MESSAGES_FILE_PATH);

        return userThreads.map((thread) => {
            const threadMessages = messages.filter((message) => message.threadId === thread.id);

            const lastMessage = threadMessages.length > 0
                ? threadMessages.sort((a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                )[0]
                : undefined;

            const unreadCount = threadMessages.filter(
                (message) => message.senderId !== userId && !message.read
            ).length;

            return {
                ...thread,
                lastMessage,
                unreadCount,
            };
        }).sort((a, b) => {
            const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : new Date(a.createdAt).getTime();
            const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : new Date(b.createdAt).getTime();
            return dateB - dateA;
        });
    },

    getThreadBetweenUsers: (userIds: string[], bookId?: string): MessageThread | null => {
        const threads = FileOps.readJsonFile<MessageThread>(THREADS_FILE_PATH);

        return threads.find((thread) => {
            const hasAllUsers = userIds.every((userId) =>
                thread.participants.some((participant) => participant.id === userId)
            );

            const hasMatchingBook = !bookId || (thread.book && thread.book.id === bookId);

            return hasAllUsers && hasMatchingBook && thread.participants.length === userIds.length;
        }) || null;
    },

    createThread: (
        participants: Array<{ id: string; name: string }>,
        bookId?: string
    ): MessageThread => {
        const threads = FileOps.readJsonFile<MessageThread>(THREADS_FILE_PATH);

        let bookInfo: { id: string; title: string } | undefined = undefined;
        if (bookId) {
            const book = BookModel.getById(bookId);
            if (book) {
                bookInfo = {
                    id: book.id,
                    title: book.title,
                };
            }
        }

        const now = new Date().toISOString();
        const newThread: MessageThread = {
            id: uuidv4(),
            participants,
            unreadCount: 0,
            book: bookInfo,
            createdAt: now,
            updatedAt: now,
        };

        threads.push(newThread);
        FileOps.writeJsonFile(THREADS_FILE_PATH, threads);

        return {
            ...newThread,
            lastMessage: undefined,
        };
    },

    sendMessage: (
        threadId: string,
        senderId: string,
        content: string
    ): Message => {
        const messages = FileOps.readJsonFile<Message>(MESSAGES_FILE_PATH);
        const threads = FileOps.readJsonFile<MessageThread>(THREADS_FILE_PATH);

        const threadIndex = threads.findIndex((thread) => thread.id === threadId);
        if (threadIndex === -1) {
            throw new Error("Thread not found");
        }

        const thread = threads[threadIndex];
        const isParticipant = thread.participants.some((p) => p.id === senderId);
        if (!isParticipant) {
            throw new Error("User is not a participant in this thread");
        }

        const users = FileOps.readJsonFile<{ id: string; name: string }>(USERS_FILE_PATH);
        const user = users.find((u) => u.id === senderId);
        const senderName = user ? user.name : "Unknown User";

        const receiver = thread.participants.find((p) => p.id !== senderId);
        const receiverId = receiver?.id || '';

        const now = new Date().toISOString();
        const newMessage: Message = {
            id: uuidv4(),
            threadId,
            senderId,
            senderName,
            content,
            read: false,
            createdAt: now,
            receiverId,
        };

        messages.push(newMessage);
        FileOps.writeJsonFile(MESSAGES_FILE_PATH, messages);

        threads[threadIndex].updatedAt = now;
        FileOps.writeJsonFile(THREADS_FILE_PATH, threads);

        return newMessage;
    },

    markMessageAsRead: (messageId: string): boolean => {
        const messages = FileOps.readJsonFile<Message>(MESSAGES_FILE_PATH);
        const messageIndex = messages.findIndex((message) => message.id === messageId);

        if (messageIndex === -1) {
            return false;
        }

        messages[messageIndex].read = true;
        FileOps.writeJsonFile(MESSAGES_FILE_PATH, messages);

        return true;
    },

    markThreadAsRead: (threadId: string, userId: string): number => {
        const messages = FileOps.readJsonFile<Message>(MESSAGES_FILE_PATH);
        let count = 0;

        const updatedMessages = messages.map((message) => {
            if (message.threadId === threadId && message.senderId !== userId && !message.read) {
                count++;
                return {
                    ...message,
                    read: true,
                };
            }
            return message;
        });

        FileOps.writeJsonFile(MESSAGES_FILE_PATH, updatedMessages);

        return count;
    },

    getUnreadCountForUser: (userId: string): number => {
        const messages = FileOps.readJsonFile<Message>(MESSAGES_FILE_PATH);
        return messages.filter(
            (message) => message.senderId !== userId && !message.read
        ).length;
    },

    deleteThread: (threadId: string): boolean => {
        const threads = FileOps.readJsonFile<MessageThread>(THREADS_FILE_PATH);
        const messages = FileOps.readJsonFile<Message>(MESSAGES_FILE_PATH);

        const filteredThreads = threads.filter((thread) => thread.id !== threadId);
        if (filteredThreads.length === threads.length) {
            return false;
        }

        const filteredMessages = messages.filter((message) => message.threadId !== threadId);

        FileOps.writeJsonFile(THREADS_FILE_PATH, filteredThreads);
        FileOps.writeJsonFile(MESSAGES_FILE_PATH, filteredMessages);

        return true;
    },
};
