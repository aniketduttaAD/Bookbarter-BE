import { v4 as uuidv4 } from "uuid";
import { FileOps } from "../utils/fileOps";

const VIEWS_FILE_PATH = "data/views.json";

interface BookView {
    id: string;
    bookId: string;
    userId?: string;
    userName?: string;
    sessionId: string;
    timestamp: string;
}

export const ViewModel = {
    recordView: (bookId: string, userId?: string, userName?: string, sessionId?: string): void => {
        const views = FileOps.readJsonFile<BookView>(VIEWS_FILE_PATH);
        const session = sessionId || uuidv4();
        const fifteenMinutesAgo = new Date();
        fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);
        const recentView = views.find(
            (view) =>
                view.bookId === bookId &&
                view.sessionId === session &&
                new Date(view.timestamp) > fifteenMinutesAgo
        );
        if (recentView) return;
        const newView: BookView = {
            id: uuidv4(),
            bookId,
            userId,
            userName,
            timestamp: new Date().toISOString(),
            sessionId: session,
        };
        views.push(newView);
        FileOps.writeJsonFile(VIEWS_FILE_PATH, views);
    },
    getActiveViewers: (bookId: string): { count: number; usernames: string[] } => {
        const views = FileOps.readJsonFile<BookView>(VIEWS_FILE_PATH);
        const fiveMinutesAgo = new Date();
        fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
        const uniqueSessions = new Map<string, BookView>();
        views.forEach((view) => {
            if (
                view.bookId === bookId &&
                new Date(view.timestamp) > fiveMinutesAgo
            ) {
                const existing = uniqueSessions.get(view.sessionId);
                if (!existing || new Date(view.timestamp) > new Date(existing.timestamp)) {
                    uniqueSessions.set(view.sessionId, view);
                }
            }
        });
        const usernames = Array.from(uniqueSessions.values())
            .filter((view) => view.userName)
            .map((view) => view.userName as string);
        return {
            count: uniqueSessions.size,
            usernames,
        };
    },
    getTotalViews: (bookId: string): number => {
        const views = FileOps.readJsonFile<BookView>(VIEWS_FILE_PATH);
        const uniqueSessions = new Set();
        views.forEach((view) => {
            if (view.bookId === bookId) {
                uniqueSessions.add(view.sessionId);
            }
        });
        return uniqueSessions.size;
    },
    cleanupOldViews: (): number => {
        const views = FileOps.readJsonFile<BookView>(VIEWS_FILE_PATH);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentViews = views.filter(
            (view) => new Date(view.timestamp) > sevenDaysAgo
        );
        const deletedCount = views.length - recentViews.length;
        FileOps.writeJsonFile(VIEWS_FILE_PATH, recentViews);
        return deletedCount;
    },
};
