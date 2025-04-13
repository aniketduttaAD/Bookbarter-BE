import { v4 as uuidv4 } from "uuid";
import { FileOps } from "../utils/fileOps";
import { Book, BookStatus } from "../types";

const BOOKS_FILE_PATH = "data/books.json";

export const BookModel = {
    getAll: (params: {
        genre?: string;
        condition?: string;
        status?: string;
        location?: string;
        search?: string;
        ownerId?: string;
        sortBy?: string;
        sortOrder?: "asc" | "desc";
        page?: number;
        limit?: number;
    }) => {
        const {
            genre,
            condition,
            status,
            location,
            search,
            ownerId,
            sortBy = "createdAt",
            sortOrder = "desc",
            page = 1,
            limit = 12,
        } = params;

        let books = FileOps.readJsonFile<Book>(BOOKS_FILE_PATH);

        if (genre) {
            books = books.filter((book) => book.genre === genre);
        }

        if (condition) {
            books = books.filter((book) => book.condition === condition);
        }

        if (status) {
            books = books.filter((book) => book.status === status);
        }

        if (location) {
            books = books.filter((book) =>
                book.location.toLowerCase().includes(location.toLowerCase())
            );
        }

        if (ownerId) {
            books = books.filter((book) => book.ownerId === ownerId);
        }

        if (search) {
            const searchLower = search.toLowerCase();
            books = books.filter((book) =>
                book.title.toLowerCase().includes(searchLower) ||
                book.author.toLowerCase().includes(searchLower) ||
                book.description.toLowerCase().includes(searchLower)
            );
        }

        const validSortFields = ["createdAt", "title", "author"];
        const validSortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";

        books.sort((a, b) => {
            const fieldA = a[validSortField as keyof Book];
            const fieldB = b[validSortField as keyof Book];

            if (typeof fieldA === "string" && typeof fieldB === "string") {
                return sortOrder === "asc"
                    ? fieldA.localeCompare(fieldB)
                    : fieldB.localeCompare(fieldA);
            } else {
                const dateA = new Date(fieldA as string).getTime();
                const dateB = new Date(fieldB as string).getTime();
                return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
            }
        });

        const totalBooks = books.length;
        const totalPages = Math.ceil(totalBooks / limit);
        const start = (page - 1) * limit;
        const end = start + limit;
        const paginatedBooks = books.slice(start, end);

        return {
            books: paginatedBooks,
            total: totalBooks,
            page,
            limit,
            totalPages,
        };
    },

    getById: (id: string): Book | null => {
        const books = FileOps.readJsonFile<Book>(BOOKS_FILE_PATH);
        const book = books.find((book) => book.id === id);
        return book || null;
    },

    create: (bookData: Omit<Book, "id" | "createdAt" | "updatedAt">): Book => {
        const books = FileOps.readJsonFile<Book>(BOOKS_FILE_PATH);

        const now = new Date().toISOString();
        const newBook: Book = {
            id: uuidv4(),
            ...bookData,
            createdAt: now,
            updatedAt: now,
        };

        books.push(newBook);
        FileOps.writeJsonFile(BOOKS_FILE_PATH, books);

        return newBook;
    },

    update: (id: string, bookData: Partial<Book>): Book | null => {
        const books = FileOps.readJsonFile<Book>(BOOKS_FILE_PATH);
        const index = books.findIndex((book) => book.id === id);

        if (index === -1) {
            return null;
        }

        const now = new Date().toISOString();
        const updatedBook: Book = {
            ...books[index],
            ...bookData,
            updatedAt: now,
        };

        books[index] = updatedBook;
        FileOps.writeJsonFile(BOOKS_FILE_PATH, books);

        return updatedBook;
    },

    delete: (id: string): boolean => {
        const books = FileOps.readJsonFile<Book>(BOOKS_FILE_PATH);
        const filteredBooks = books.filter((book) => book.id !== id);

        if (filteredBooks.length === books.length) {
            return false;
        }

        FileOps.writeJsonFile(BOOKS_FILE_PATH, filteredBooks);
        return true;
    },

    updateStatus: (id: string, status: BookStatus): Book | null => {
        return BookModel.update(id, { status });
    },
};
