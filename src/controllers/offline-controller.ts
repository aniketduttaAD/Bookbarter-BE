import { Request, Response, NextFunction } from "express";
import { BookModel } from "../models/book-model";
import { RatingModel } from "../models/rating-model"; // Import Rating interface
import { WishlistModel } from "../models/wishlist-model";
import { Rating } from "../types";

export const getApiMetadata = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const metadata = {
            version: "1.0.0",
            endpoints: [
                {
                    path: "/api/books",
                    methods: ["GET", "POST"],
                    cacheable: true,
                    offlineSupport: true,
                },
                {
                    path: "/api/books/:id",
                    methods: ["GET", "PATCH", "DELETE"],
                    cacheable: true,
                    offlineSupport: true,
                },
                {
                    path: "/api/ratings",
                    methods: ["GET", "POST"],
                    cacheable: true,
                    offlineSupport: true,
                },
                {
                    path: "/api/wishlist",
                    methods: ["GET", "POST"],
                    cacheable: true,
                    offlineSupport: true,
                },
                {
                    path: "/api/messages",
                    methods: ["GET", "POST"],
                    cacheable: false,
                    offlineSupport: false,
                },
                {
                    path: "/api/notifications",
                    methods: ["GET"],
                    cacheable: false,
                    offlineSupport: false,
                },
            ],
            cacheLifetime: {
                books: "1 hour",
                ratings: "1 day",
                wishlist: "1 day",
            },
        };

        res.status(200).json(metadata);
    } catch (error) {
        next(error);
    }
};

export const ping = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    res.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString()
    });
};

export const getOfflineBundle = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const userBooks = BookModel.getAll({ ownerId: userId }).books;
        const recentBooks = BookModel.getAll({
            limit: 50,
            sortBy: "createdAt",
            sortOrder: "desc"
        }).books;
        const wishlist = WishlistModel.getByUserId(userId);

        const ratings: Rating[] = [];

        for (const book of userBooks) {
            const bookRatings = RatingModel.getByBookId(book.id);
            ratings.push(...bookRatings);
        }

        const bundle = {
            timestamp: new Date().toISOString(),
            userBooks,
            recentBooks,
            wishlist,
            ratings,
        };

        res.status(200).json(bundle);
    } catch (error) {
        next(error);
    }
};