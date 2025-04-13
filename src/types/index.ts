export type UserRole = "owner" | "seeker";

export interface User {
    id: string;
    name: string;
    email: string;
    password: string;
    role: UserRole;
    mobile: string;
    createdAt: string;
    updatedAt: string;
}

export type BookCondition = "new" | "like-new" | "good" | "fair" | "poor";
export type BookStatus = "available" | "reserved" | "exchanged";
export type BookGenre =
    | "fiction"
    | "non-fiction"
    | "mystery"
    | "sci-fi"
    | "fantasy"
    | "romance"
    | "thriller"
    | "biography"
    | "history"
    | "science"
    | "self-help"
    | "children"
    | "young-adult"
    | "poetry"
    | "comics"
    | "other";

export interface Book {
    id: string;
    title: string;
    author: string;
    genre: BookGenre;
    description: string;
    condition: BookCondition;
    location: string;
    contactPreference: string;
    imageUrl?: string;
    ownerId: string;
    ownerName: string;
    status: BookStatus;
    createdAt: string;
    updatedAt: string;
}

export interface Rating {
    id: string;
    userId: string;
    bookId: string;
    ownerId: string;
    rating: number;
    review?: string;
    createdAt: string;
}

export interface WishlistItem {
    id: string;
    userId: string;
    title: string;
    author?: string;
    createdAt: string;
}

export interface Rating {
    id: string;
    userId: string;
    userName: string;
    bookId: string;
    ownerId: string;
    rating: number;
    review?: string;
    createdAt: string;
}

export interface WishlistItem {
    id: string;
    userId: string;
    title: string;
    author?: string;
    matchCount: number;
    createdAt: string;
}

export interface Message {
    id: string;
    senderId: string;
    receiverId?: string;
    threadId: string;
    senderName: string;
    bookId?: string;
    content: string;
    read: boolean;
    createdAt: string;
}

export interface MessageThread {
    id: string;
    participants: Array<{
        id: string;
        name: string;
    }>;
    lastMessage?: Message;
    unreadCount: number;
    book?: {
        id: string;
        title: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: 'book_interest' | 'book_status' | 'wishlist_match' | 'rating_received' | 'message_received' | 'system';
    read: boolean;
    link?: string;
    createdAt: string;
}
