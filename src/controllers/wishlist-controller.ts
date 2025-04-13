import { Response, NextFunction, Request } from "express";
import { ZodError } from "zod";
import { WishlistModel } from "../models/wishlist-model";
import { BookModel } from "../models/book-model";
import { wishlistItemSchema } from "../schemas";
import { ApiError } from "../middleware/error-middleware";

export const getWishlist = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new ApiError(401, "Unauthorized");
        }

        const wishlistItems = WishlistModel.getByUserId(userId);
        res.status(200).json(wishlistItems);
    } catch (error) {
        next(error);
    }
};

export const getWishlistItem = (
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
        const item = WishlistModel.getById(id);

        if (!item) {
            throw new ApiError(404, "Wishlist item not found");
        }

        if (item.userId !== userId) {
            throw new ApiError(403, "You don't have permission to access this wishlist item");
        }

        res.status(200).json(item);
    } catch (error) {
        next(error);
    }
};

export const addWishlistItem = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new ApiError(401, "Unauthorized");
        }

        const validatedData = wishlistItemSchema.parse(req.body);

        const newItem = WishlistModel.create(userId, validatedData);

        res.status(201).json(newItem);
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({
                message: "Validation error",
                errors: error.errors,
            });
            return;
        }

        if (error instanceof Error && error.message === "This book is already in your wishlist") {
            res.status(400).json({ message: error.message });
            return;
        }

        next(error);
    }
};

export const deleteWishlistItem = (
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

        const item = WishlistModel.getById(id);
        if (!item) {
            throw new ApiError(404, "Wishlist item not found");
        }

        if (item.userId !== userId) {
            throw new ApiError(403, "You don't have permission to delete this wishlist item");
        }

        const success = WishlistModel.delete(id);

        if (!success) {
            throw new ApiError(500, "Failed to delete wishlist item");
        }

        res.status(200).json({ message: "Wishlist item deleted successfully" });
    } catch (error) {
        next(error);
    }
};

export const addBookToWishlist = (
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

        const book = BookModel.getById(bookId);
        if (!book) {
            throw new ApiError(404, "Book not found");
        }

        const isInWishlist = WishlistModel.isBookInWishlist(userId, bookId);
        if (isInWishlist) {
            throw new ApiError(400, "This book is already in your wishlist");
        }

        const newItem = WishlistModel.addBookToWishlist(userId, bookId);

        if (!newItem) {
            throw new ApiError(500, "Failed to add book to wishlist");
        }

        res.status(201).json(newItem);
    } catch (error) {
        next(error);
    }
};

export const checkBookInWishlist = (
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

        const book = BookModel.getById(bookId);
        if (!book) {
            throw new ApiError(404, "Book not found");
        }

        const inWishlist = WishlistModel.isBookInWishlist(userId, bookId);

        res.status(200).json({ inWishlist });
    } catch (error) {
        next(error);
    }
};
