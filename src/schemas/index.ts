import { z } from "zod";
import { BookCondition, BookGenre, BookStatus } from "../types";

// User schemas
export const userSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z
        .string()
        .min(6, "Password must be at least 6 characters")
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            "Password must include uppercase, lowercase, and number"
        ),
    role: z.enum(["owner", "seeker"], {
        required_error: "Please select a role",
    }),
    mobile: z.string().regex(/^\d{10}$/, "Mobile number must be 10 digits"),
});

export const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
    rememberMe: z.boolean().optional(),
});

// Book schemas
export const bookGenreSchema = z.enum([
    "fiction",
    "non-fiction",
    "mystery",
    "sci-fi",
    "fantasy",
    "romance",
    "thriller",
    "biography",
    "history",
    "science",
    "self-help",
    "children",
    "young-adult",
    "poetry",
    "comics",
    "other"
] as [BookGenre, ...BookGenre[]]);

export const bookConditionSchema = z.enum([
    "new",
    "like-new",
    "good",
    "fair",
    "poor"
] as [BookCondition, ...BookCondition[]]);

export const bookStatusSchema = z.enum([
    "available",
    "reserved",
    "exchanged"
] as [BookStatus, ...BookStatus[]]);

export const bookSchema = z.object({
    title: z
        .string()
        .min(1, "Title is required")
        .max(100, "Title must be less than 100 characters"),
    author: z
        .string()
        .min(1, "Author is required")
        .max(100, "Author must be less than 100 characters"),
    genre: bookGenreSchema,
    description: z
        .string()
        .min(10, "Description must be at least 10 characters")
        .max(1000, "Description must be less than 1000 characters"),
    condition: bookConditionSchema,
    location: z
        .string()
        .min(2, "Location is required")
        .max(100, "Location must be less than 100 characters"),
    contactPreference: z
        .string()
        .min(2, "Contact preference is required")
        .max(100, "Contact preference must be less than 100 characters"),
    imageUrl: z.string().optional(),
});

// Rating schema
export const ratingSchema = z.object({
    bookId: z.string().min(1, "Book ID is required"),
    ownerId: z.string().min(1, "Owner ID is required"),
    rating: z.number().min(1, "Rating must be at least 1").max(5, "Rating cannot exceed 5"),
    review: z.string().optional(),
});

// Wishlist schema
export const wishlistItemSchema = z.object({
    title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
    author: z.string().max(100, "Author must be less than 100 characters").optional(),
});