import { Request, Response, NextFunction, RequestHandler } from "express";
import { verifyToken, TokenPayload } from "../utils/token";

declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}

export const authenticate: RequestHandler = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({ message: "Authentication required" });
            return;
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            res.status(401).json({ message: "Authentication required" });
            return;
        }

        const payload = verifyToken(token);

        req.user = payload;
        next();
    } catch (error) {
        res.status(401).json({ message: "Invalid or expired token" });
    }
};

export const authorizeRole = (roles: string[]): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ message: "Authentication required" });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({ message: "Insufficient permissions" });
            return;
        }

        next();
    };
};