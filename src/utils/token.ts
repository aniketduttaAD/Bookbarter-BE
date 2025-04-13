import jwt from "jsonwebtoken";
import { User } from "../types";

const JWT_SECRET = process.env.JWT_SECRET || "p2p-book-exchange-secret-key";
const TOKEN_EXPIRY = "7d";
export interface TokenPayload {
    userId: string;
    email: string;
    role: string;
}

export const generateToken = (user: User): string => {
    const payload: TokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
};

export const verifyToken = (token: string): TokenPayload => {
    try {
        return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (error) {
        throw new Error("Invalid or expired token");
    }
};