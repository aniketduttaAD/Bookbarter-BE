import { RequestHandler } from "express";
import { BookModel } from "../models/book-model";
import { RatingModel } from "../models/rating-model";
import { ApiError } from "../middleware/error-middleware";

export const getUserStats: RequestHandler = (req, res, next) => {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) {
            throw new ApiError(401, "Unauthorized");
        }

        const userBooks = BookModel.getAll({ ownerId: userId }).books;
        const booksShared = userBooks.length;
        const booksExchanged = userBooks.filter((book) => book.status === "exchanged").length;
        const averageRating = RatingModel.getAverageRatingForOwner(userId);
        const ownerRatings = RatingModel.getByOwnerId(userId);
        const totalRatings = ownerRatings.length;

        const recentActivity = [
            ...userBooks
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 3)
                .map((book) => ({
                    type: "book_added",
                    date: book.createdAt,
                    details: `You added "${book.title}" to your collection`,
                })),
            ...ownerRatings
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 3)
                .map((rating) => {
                    const book = BookModel.getById(rating.bookId);
                    return book
                        ? {
                            type: "rating_received",
                            date: rating.createdAt,
                            details: `You received a ${rating.rating}-star rating for "${book.title}"`,
                        }
                        : null;
                })
                .filter(Boolean) as { type: string; date: string; details: string }[],
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        res.status(200).json({
            booksShared,
            booksExchanged,
            averageRating,
            totalRatings,
            recentActivity: recentActivity.slice(0, 5),
        });
    } catch (error) {
        next(error);
    }
};
