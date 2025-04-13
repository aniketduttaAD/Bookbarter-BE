import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { verifyToken } from "../utils/token";
import { ViewModel } from "../models/view-model";
import { FileOps } from "../utils/fileOps";

const bookViewers = new Map<string, Set<string>>();
const userSockets = new Map<string, string>();
const socketSessions = new Map<string, {
    userId?: string;
    userName?: string;
    currentRoom?: string;
}>();

export const initSocketIO = (httpServer: HttpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:3000",
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    io.use((socket, next) => {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error("Authentication required"));
        }

        try {
            const decoded = verifyToken(token);
            socket.data.user = decoded;

            socketSessions.set(socket.id, {
                userId: decoded.userId,
                userName: undefined,
            });

            userSockets.set(decoded.userId, socket.id);

            next();
        } catch (error) {
            next(new Error("Invalid token"));
        }
    });

    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        if (socket.data.user?.userId) {
            socket.join(`user:${socket.data.user.userId}`);

            const users = FileOps.readJsonFile("data/users.json");
            const user = users.find((u: any) => u.id === socket.data.user.userId);

            if (user && typeof user === 'object' && user !== null && 'name' in user) {
                const session = socketSessions.get(socket.id);
                if (session) {
                    session.userName = user.name as string;
                    socketSessions.set(socket.id, session);
                }
            }
        }

        socket.on("book:join", (bookId) => {
            console.log(`User ${socket.id} joining book room: ${bookId}`);

            const session = socketSessions.get(socket.id);
            if (session?.currentRoom) {
                socket.leave(session.currentRoom);

                const viewers = bookViewers.get(session.currentRoom);
                if (viewers) {
                    viewers.delete(socket.id);

                    updateViewersCount(io, session.currentRoom);

                    if (session.currentRoom.startsWith("book:")) {
                        const bookId = session.currentRoom.substring(5);
                        if (session.userId) {
                            ViewModel.recordView(bookId, session.userId, session.userName);
                        }
                    }
                }
            }

            const roomName = `book:${bookId}`;
            socket.join(roomName);

            let viewers = bookViewers.get(bookId);
            if (!viewers) {
                viewers = new Set<string>();
                bookViewers.set(bookId, viewers);
            }
            viewers.add(socket.id);

            if (session) {
                session.currentRoom = roomName;
                socketSessions.set(socket.id, session);
            }

            updateViewersCount(io, bookId);
        });

        socket.on("book:leave", (bookId) => {
            console.log(`User ${socket.id} leaving book room: ${bookId}`);

            const roomName = `book:${bookId}`;
            socket.leave(roomName);

            const viewers = bookViewers.get(bookId);
            if (viewers) {
                viewers.delete(socket.id);

                updateViewersCount(io, bookId);

                const session = socketSessions.get(socket.id);
                if (session?.userId) {
                    ViewModel.recordView(bookId, session.userId, session.userName);
                }
            }

            const session = socketSessions.get(socket.id);
            if (session && session.currentRoom === roomName) {
                session.currentRoom = undefined;
                socketSessions.set(socket.id, session);
            }
        });

        socket.on("thread:join", (threadId) => {
            const roomName = `thread:${threadId}`;
            socket.join(roomName);

            const session = socketSessions.get(socket.id);
            if (session) {
                session.currentRoom = roomName;
                socketSessions.set(socket.id, session);
            }

            console.log(`User ${socket.id} joined thread: ${threadId}`);
        });

        socket.on("thread:leave", (threadId) => {
            const roomName = `thread:${threadId}`;
            socket.leave(roomName);

            const session = socketSessions.get(socket.id);
            if (session && session.currentRoom === roomName) {
                session.currentRoom = undefined;
                socketSessions.set(socket.id, session);
            }

            console.log(`User ${socket.id} left thread: ${threadId}`);
        });

        socket.on("typing:start", ({ threadId }) => {
            const userName = socketSessions.get(socket.id)?.userName || "Someone";

            socket.to(`thread:${threadId}`).emit("typing:update", {
                threadId,
                isTyping: true,
                userName,
            });
        });

        socket.on("typing:stop", ({ threadId }) => {
            socket.to(`thread:${threadId}`).emit("typing:update", {
                threadId,
                isTyping: false,
            });
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);

            const session = socketSessions.get(socket.id);
            if (session) {
                if (session.currentRoom?.startsWith("book:")) {
                    const bookId = session.currentRoom.substring(5);
                    const viewers = bookViewers.get(bookId);
                    if (viewers) {
                        viewers.delete(socket.id);
                        updateViewersCount(io, bookId);

                        if (session.userId) {
                            ViewModel.recordView(bookId, session.userId, session.userName);
                        }
                    }
                }

                if (session.userId) {
                    userSockets.delete(session.userId);
                }

                socketSessions.delete(socket.id);
            }
        });
    });

    (global as any).io = io;

    return io;
};

function updateViewersCount(io: Server, bookId: string) {
    const viewers = bookViewers.get(bookId) || new Set<string>();

    const usernames: string[] = [];
    viewers.forEach(socketId => {
        const session = socketSessions.get(socketId);
        if (session?.userName) {
            usernames.push(session.userName);
        }
    });

    io.to(`book:${bookId}`).emit("book:viewers", {
        count: viewers.size,
        usernames,
    });
}

export const sendNotificationToUser = (userId: string, notification: any) => {
    const io = (global as any).io;
    if (!io) return;

    const socketId = userSockets.get(userId);
    if (socketId) {
        io.to(`user:${userId}`).emit("notification:new", notification);
    }
};

export const sendMessageToThread = (threadId: string, message: any) => {
    const io = (global as any).io;
    if (!io) return;

    io.to(`thread:${threadId}`).emit("message:new", message);
};

export const notifyMessageRead = (threadId: string, messageId: string) => {
    const io = (global as any).io;
    if (!io) return;

    io.to(`thread:${threadId}`).emit("message:read", messageId);
};

export const notifyThreadUpdate = (threadId: string, thread: any) => {
    const io = (global as any).io;
    if (!io) return;

    io.to(`thread:${threadId}`).emit("thread:update", thread);
};