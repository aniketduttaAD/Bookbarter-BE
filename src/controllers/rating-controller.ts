import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { RatingModel } from "../models/rating-model";
import { BookModel } from "../models/book-model";
import { ratingSchema } from "../schemas";
import { ApiError } from "../middleware/error-middleware";

export const getRatings = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const ratings = RatingModel.getAll();
        res.status(200).json(ratings);
    } catch (error) {
        next(error);
    }
};

export const getRatingById = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;
        const rating = RatingModel.getById(id);

        if (!rating) {
            throw new ApiError(404, "Rating not found");
        }

        res.status(200).json(rating);
    } catch (error) {
        next(error);
    }
};

export const getBookRatings = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { bookId } = req.params;
        const book = BookModel.getById(bookId);
        if (!book) {
            throw new ApiError(404, "Book not found");
        }

        const ratings = RatingModel.getByBookId(bookId);
        res.status(200).json(ratings);
    } catch (error) {
        next(error);
    }
};

export const getOwnerRatings = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { ownerId } = req.params;
        const ratings = RatingModel.getByOwnerId(ownerId);
        res.status(200).json(ratings);
    } catch (error) {
        next(error);
    }
};

export const getUserRatingForBook = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new ApiError(401, "Unauthorized");
        }

        const { bookId } = req.params;
        const rating = RatingModel.getByUserAndBookId(userId, bookId);

        if (!rating) {
            throw new ApiError(404, "Rating not found");
        }

        res.status(200).json(rating);
    } catch (error) {
        next(error);
    }
};

export const createRating = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new ApiError(401, "Unauthorized");
        }

        const validatedData = ratingSchema.parse(req.body);
        const book = BookModel.getById(validatedData.bookId);

        if (!book) {
            throw new ApiError(404, "Book not found");
        }

        if (book.ownerId === userId) {
            throw new ApiError(400, "You cannot rate your own book");
        }

        const newRating = RatingModel.create({
            ...validatedData,
            userId,
        });

        res.status(201).json(newRating);
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({
                message: "Validation error",
                errors: error.errors,
            });
            return;
        }

        if (
            error instanceof Error &&
            error.message === "User has already rated this book"
        ) {
            res.status(400).json({ message: error.message });
            return;
        }

        next(error);
    }
};

export const deleteRating = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new ApiError(401, "Unauthorized");
        }

        const { id } = req.params;
        const rating = RatingModel.getById(id);
        if (!rating) {
            throw new ApiError(404, "Rating not found");
        }

        if (rating.userId !== userId) {
            throw new ApiError(403, "You don't have permission to delete this rating");
        }

        const success = RatingModel.delete(id);
        if (!success) {
            throw new ApiError(500, "Failed to delete rating");
        }

        res.status(200).json({ message: "Rating deleted successfully" });
    } catch (error) {
        next(error);
    }
};
