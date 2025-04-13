import { v4 as uuidv4 } from "uuid";
import { FileOps } from "../utils/fileOps";
import { WishlistItem } from "../types";
import { BookModel } from "./book-model";

const WISHLIST_FILE_PATH = "data/wishlist.json";

export const WishlistModel = {
    getByUserId: (userId: string): WishlistItem[] => {
        const wishlistItems = FileOps.readJsonFile<WishlistItem>(WISHLIST_FILE_PATH);
        return wishlistItems
            .filter((item) => item.userId === userId)
            .map((item) => ({
                ...item,
                matchCount: WishlistModel.countMatches(item),
            }));
    },

    getById: (id: string): WishlistItem | null => {
        const wishlistItems = FileOps.readJsonFile<WishlistItem>(WISHLIST_FILE_PATH);
        const item = wishlistItems.find((item) => item.id === id);

        if (!item) {
            return null;
        }

        return {
            ...item,
            matchCount: WishlistModel.countMatches(item),
        };
    },

    create: (userId: string, data: { title: string; author?: string }): WishlistItem => {
        const wishlistItems = FileOps.readJsonFile<WishlistItem>(WISHLIST_FILE_PATH);

        const isDuplicate = wishlistItems.some(
            (item) =>
                item.userId === userId &&
                item.title.toLowerCase() === data.title.toLowerCase() &&
                (!data.author || !item.author || item.author.toLowerCase() === data.author.toLowerCase())
        );

        if (isDuplicate) {
            throw new Error("This book is already in your wishlist");
        }

        const now = new Date().toISOString();
        const newItem: WishlistItem = {
            id: uuidv4(),
            userId,
            title: data.title,
            author: data.author,
            matchCount: 0,
            createdAt: now,
        };

        wishlistItems.push(newItem);
        FileOps.writeJsonFile(WISHLIST_FILE_PATH, wishlistItems);

        return {
            ...newItem,
            matchCount: WishlistModel.countMatches(newItem),
        };
    },

    delete: (id: string): boolean => {
        const wishlistItems = FileOps.readJsonFile<WishlistItem>(WISHLIST_FILE_PATH);
        const filteredItems = wishlistItems.filter((item) => item.id !== id);

        if (filteredItems.length === wishlistItems.length) {
            return false;
        }

        FileOps.writeJsonFile(WISHLIST_FILE_PATH, filteredItems);
        return true;
    },

    addBookToWishlist: (userId: string, bookId: string): WishlistItem | null => {
        const book = BookModel.getById(bookId);
        if (!book) {
            return null;
        }

        return WishlistModel.create(userId, {
            title: book.title,
            author: book.author,
        });
    },

    isBookInWishlist: (userId: string, bookId: string): boolean => {
        const book = BookModel.getById(bookId);
        if (!book) {
            return false;
        }

        const wishlistItems = FileOps.readJsonFile<WishlistItem>(WISHLIST_FILE_PATH);

        return wishlistItems.some(
            (item) =>
                item.userId === userId &&
                item.title.toLowerCase() === book.title.toLowerCase() &&
                (!item.author || item.author.toLowerCase() === book.author.toLowerCase())
        );
    },

    countMatches: (item: Omit<WishlistItem, "matchCount">): number => {
        const books = BookModel.getAll({
            status: "available",
        }).books;

        return books.filter((book) => {
            const titleMatch = book.title.toLowerCase().includes(item.title.toLowerCase()) ||
                item.title.toLowerCase().includes(book.title.toLowerCase());

            let authorMatch = true;
            if (item.author && item.author.trim() !== "") {
                authorMatch = book.author.toLowerCase().includes(item.author.toLowerCase()) ||
                    item.author.toLowerCase().includes(book.author.toLowerCase());
            }

            return titleMatch && authorMatch;
        }).length;
    },
};
