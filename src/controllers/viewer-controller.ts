import { Request, Response, NextFunction } from "express";
import { ViewModel } from "../models/view-model";
import { FileOps } from "../utils/fileOps";

export const getBookViewers = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { bookId } = req.params;
        const { count, usernames } = ViewModel.getActiveViewers(bookId);
        res.status(200).json({ count, usernames });
    } catch (error) {
        next(error);
    }
};

export const recordBookView = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { bookId } = req.params;
        const userId = req.user?.userId;
        const sessionId = req.headers["x-session-id"] as string;
        let userName: string | undefined;
        if (userId) {
            const users = FileOps.readJsonFile("data/users.json");
            const user = users.find((u: any) => u.id === userId);
            userName = user ? (user as { name: string }).name : undefined;
        }
        ViewModel.recordView(bookId, userId, userName, sessionId);
        res.status(200).json({ message: "View recorded" });
    } catch (error) {
        next(error);
    }
};