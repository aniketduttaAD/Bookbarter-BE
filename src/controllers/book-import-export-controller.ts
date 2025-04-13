import { Request, Response, NextFunction } from "express";
import { BookModel } from "../models/book-model";
import { ApiError } from "../middleware/error-middleware";
import { z } from "zod";
import { Book } from "../types";
import { User } from "../types";
import { FileOps } from "../utils/fileOps";

const importBookSchema = z.array(
    z.object({
        title: z.string().min(1),
        author: z.string().min(1),
        genre: z.enum([
            "fiction", "non-fiction", "mystery", "sci-fi", "fantasy", "romance",
            "thriller", "biography", "history", "science", "self-help",
            "children", "young-adult", "poetry", "comics", "other"
        ]),
        description: z.string(),
        condition: z.enum(["new", "like-new", "good", "fair", "poor"]),
        location: z.string(),
        contactPreference: z.string(),
        imageUrl: z.string().optional(),
    })
);

export const importBooks = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.userId;
        if (!userId) throw new ApiError(401, "Unauthorized");

        const importedData = importBookSchema.parse(req.body);
        const importedBooks: Book[] = [];
        const errors: { book: string; error: string }[] = [];

        const users: User[] = FileOps.readJsonFile("data/users.json");
        const currentUser = users.find(u => u.id === userId);
        const ownerName = currentUser?.name ?? "Unknown";

        for (const bookData of importedData) {
            try {
                const book = BookModel.create({
                    ...bookData,
                    ownerId: userId,
                    ownerName,
                    status: "available",
                });
                importedBooks.push(book);
            } catch (error) {
                errors.push({
                    book: bookData.title,
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }

        res.status(200).json({
            success: true,
            imported: importedBooks.length,
            errors,
            message: `Successfully imported ${importedBooks.length} books.`,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                message: "Invalid import data",
                errors: error.errors,
            });
        } else {
            next(error);
        }
    }
};

export const exportBooks = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new ApiError(401, "Unauthorized");
        }
        const { books } = BookModel.getAll({ ownerId: userId });
        const exportedBooks = books.map(book => ({
            title: book.title,
            author: book.author,
            genre: book.genre,
            description: book.description,
            condition: book.condition,
            location: book.location,
            contactPreference: book.contactPreference,
            imageUrl: book.imageUrl,
        }));
        res.setHeader("Content-Disposition", "attachment; filename=books-export.json");
        res.setHeader("Content-Type", "application/json");
        res.status(200).json(exportedBooks);
    } catch (error) {
        next(error);
    }
};