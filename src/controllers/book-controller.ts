import { Request, Response, NextFunction, RequestHandler } from "express";
import { ZodError } from "zod";
import { BookModel } from "../models/book-model";
import { FileOps } from "../utils/fileOps";
import { bookSchema } from "../schemas";
import { getImageUrl, getFilenameFromUrl, deleteImage } from "../utils/imageUpload";
import { BookStatus, User } from "../types";
import { ViewModel } from "../models/view-model";

const getUserNameById = (userId: string): string => {
    const users = FileOps.readJsonFile("data/users.json") as User[];
    const user = users.find((u) => u.id === userId);
    return user ? user.name : "Unknown User";
};

export const getBooks: RequestHandler = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        const {
            genre,
            condition,
            status,
            location,
            search,
            ownerId,
            sortBy,
            sortOrder,
            page,
            limit,
        } = req.query;

        const result = BookModel.getAll({
            genre: genre as string,
            condition: condition as string,
            status: status as string,
            location: location as string,
            search: search as string,
            ownerId: ownerId as string,
            sortBy: sortBy as string,
            sortOrder: sortOrder as "asc" | "desc",
            page: page ? parseInt(page as string) : undefined,
            limit: limit ? parseInt(limit as string) : undefined,
        });

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const getBookById: RequestHandler = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        const { id } = req.params;
        const book = BookModel.getById(id);

        if (!book) {
            res.status(404).json({ message: "Book not found" });
            return;
        }

        const sessionId = req.headers['x-session-id'] as string;
        const userId = req.user?.userId;

        if (ViewModel) {
            ViewModel.recordView(id, userId, sessionId);
        }

        res.status(200).json(book);
    } catch (error) {
        next(error);
    }
};

export const createBook: RequestHandler = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        let bookData;

        if (req.file) {
            bookData = JSON.parse(req.body.bookData);
            bookData.imageUrl = getImageUrl(req.file.filename);
        } else {
            bookData = req.body;
        }

        const validatedData = bookSchema.parse(bookData);
        const ownerName = getUserNameById(userId);

        const newBook = BookModel.create({
            ...validatedData,
            ownerId: userId,
            ownerName,
            status: "available" as BookStatus,
        });

        res.status(201).json(newBook);
    } catch (error) {
        if (req.file) {
            deleteImage(req.file.filename);
        }

        if (error instanceof ZodError) {
            res.status(400).json({
                message: "Validation error",
                errors: error.errors,
            });
            return;
        }

        next(error);
    }
};

export const updateBook: RequestHandler = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const { id } = req.params;
        const existingBook = BookModel.getById(id);

        if (!existingBook) {
            res.status(404).json({ message: "Book not found" });
            return;
        }

        if (existingBook.ownerId !== userId) {
            res.status(403).json({ message: "You don't have permission to update this book" });
            return;
        }

        let bookData;

        if (req.file) {
            bookData = JSON.parse(req.body.bookData);
            bookData.imageUrl = getImageUrl(req.file.filename);

            if (existingBook.imageUrl) {
                const oldFilename = getFilenameFromUrl(existingBook.imageUrl);
                if (oldFilename) {
                    deleteImage(oldFilename);
                }
            }
        } else {
            bookData = req.body;
        }

        const validatedData = bookSchema.partial().parse(bookData);

        const updatedBook = BookModel.update(id, validatedData);

        if (!updatedBook) {
            res.status(500).json({ message: "Failed to update book" });
            return;
        }

        res.status(200).json(updatedBook);
    } catch (error) {
        if (req.file) {
            deleteImage(req.file.filename);
        }

        if (error instanceof ZodError) {
            res.status(400).json({
                message: "Validation error",
                errors: error.errors,
            });
            return;
        }

        next(error);
    }
};

export const deleteBook: RequestHandler = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const { id } = req.params;
        const existingBook = BookModel.getById(id);

        if (!existingBook) {
            res.status(404).json({ message: "Book not found" });
            return;
        }

        if (existingBook.ownerId !== userId) {
            res.status(403).json({ message: "You don't have permission to delete this book" });
            return;
        }

        const success = BookModel.delete(id);

        if (!success) {
            res.status(500).json({ message: "Failed to delete book" });
            return;
        }

        if (existingBook.imageUrl) {
            const filename = getFilenameFromUrl(existingBook.imageUrl);
            if (filename) {
                deleteImage(filename);
            }
        }

        res.status(200).json({ message: "Book deleted successfully" });
    } catch (error) {
        next(error);
    }
};

export const updateBookStatus: RequestHandler = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const { id } = req.params;
        const { status } = req.body;

        if (!["available", "reserved", "exchanged"].includes(status)) {
            res.status(400).json({ message: "Invalid status value" });
            return;
        }

        const existingBook = BookModel.getById(id);

        if (!existingBook) {
            res.status(404).json({ message: "Book not found" });
            return;
        }

        if (existingBook.ownerId !== userId) {
            res.status(403).json({ message: "You don't have permission to update this book's status" });
            return;
        }

        const updatedBook = BookModel.updateStatus(id, status as BookStatus);

        if (!updatedBook) {
            res.status(500).json({ message: "Failed to update book status" });
            return;
        }

        res.status(200).json(updatedBook);
    } catch (error) {
        next(error);
    }
};

export const getBookViewers: RequestHandler = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        const { id } = req.params;
        const book = BookModel.getById(id);

        if (!book) {
            res.status(404).json({ message: "Book not found" });
            return;
        }

        const activeViewers = ViewModel.getActiveViewers(id);

        res.status(200).json({ viewers: activeViewers });
    } catch (error) {
        next(error);
    }
};