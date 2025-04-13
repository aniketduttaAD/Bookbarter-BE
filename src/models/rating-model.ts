import { v4 as uuidv4 } from "uuid";
import { FileOps } from "../utils/fileOps";
import { Rating, User } from "../types";

const RATINGS_FILE_PATH = "data/ratings.json";
const USERS_FILE_PATH = "data/users.json";

export const RatingModel = {
    getAll: (): Rating[] => {
        return FileOps.readJsonFile<Rating>(RATINGS_FILE_PATH);
    },

    getById: (id: string): Rating | null => {
        const ratings = FileOps.readJsonFile<Rating>(RATINGS_FILE_PATH);
        const rating = ratings.find((rating) => rating.id === id);
        return rating || null;
    },

    getByBookId: (bookId: string): Rating[] => {
        const ratings = FileOps.readJsonFile<Rating>(RATINGS_FILE_PATH);
        return ratings.filter((rating) => rating.bookId === bookId);
    },

    getByOwnerId: (ownerId: string): Rating[] => {
        const ratings = FileOps.readJsonFile<Rating>(RATINGS_FILE_PATH);
        return ratings.filter((rating) => rating.ownerId === ownerId);
    },

    getByUserId: (userId: string): Rating[] => {
        const ratings = FileOps.readJsonFile<Rating>(RATINGS_FILE_PATH);
        return ratings.filter((rating) => rating.userId === userId);
    },

    getByUserAndBookId: (userId: string, bookId: string): Rating | null => {
        const ratings = FileOps.readJsonFile<Rating>(RATINGS_FILE_PATH);
        const rating = ratings.find(
            (rating) => rating.userId === userId && rating.bookId === bookId
        );
        return rating || null;
    },

    create: (ratingData: Omit<Rating, "id" | "createdAt" | "userName">): Rating => {
        const ratings = FileOps.readJsonFile<Rating>(RATINGS_FILE_PATH);

        const existingRating = ratings.find(
            (rating) =>
                rating.userId === ratingData.userId &&
                rating.bookId === ratingData.bookId
        );

        if (existingRating) {
            throw new Error("User has already rated this book");
        }

        const users = FileOps.readJsonFile(USERS_FILE_PATH) as User[];
        const user = users.find((u) => u.id === ratingData.userId);
        const userName = user ? user.name : "Unknown User";

        const now = new Date().toISOString();
        const newRating: Rating = {
            id: uuidv4(),
            ...ratingData,
            userName,
            createdAt: now,
        };

        ratings.push(newRating);
        FileOps.writeJsonFile(RATINGS_FILE_PATH, ratings);

        return newRating;
    },

    update: (id: string, ratingData: Partial<Rating>): Rating | null => {
        const ratings = FileOps.readJsonFile<Rating>(RATINGS_FILE_PATH);
        const index = ratings.findIndex((rating) => rating.id === id);

        if (index === -1) {
            return null;
        }

        const updatedRating: Rating = {
            ...ratings[index],
            ...ratingData,
        };

        ratings[index] = updatedRating;
        FileOps.writeJsonFile(RATINGS_FILE_PATH, ratings);

        return updatedRating;
    },

    delete: (id: string): boolean => {
        const ratings = FileOps.readJsonFile<Rating>(RATINGS_FILE_PATH);
        const filteredRatings = ratings.filter((rating) => rating.id !== id);

        if (filteredRatings.length === ratings.length) {
            return false;
        }

        FileOps.writeJsonFile(RATINGS_FILE_PATH, filteredRatings);
        return true;
    },

    getAverageRatingForOwner: (ownerId: string): number => {
        const ratings = FileOps.readJsonFile<Rating>(RATINGS_FILE_PATH);
        const ownerRatings = ratings.filter((rating) => rating.ownerId === ownerId);

        if (ownerRatings.length === 0) {
            return 0;
        }

        const sum = ownerRatings.reduce((total, rating) => total + rating.rating, 0);
        return sum / ownerRatings.length;
    },
};
