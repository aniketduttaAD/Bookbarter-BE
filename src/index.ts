import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import morgan from "morgan";
import helmet from "helmet";
import path from "path";
import http from "http";
import { FileOps } from "./utils/fileOps";
import authRoutes from "./routes/auth-routes";
import bookRoutes from "./routes/book-routes";
import ratingRoutes from "./routes/rating-routes";
import wishlistRoutes from "./routes/wishlist-routes";
import messageRoutes from "./routes/message-routes";
import notificationRoutes from "./routes/notification-routes";
import viewerRoutes from "./routes/viewer-routes";
import offlineRoutes from "./routes/offline-routes";
import { errorHandler, notFoundHandler } from "./middleware/error-middleware";
import { enableServiceWorkerCaching } from "./middleware/cache-middleware";
import { initSocketIO } from "./services/socket-service";
import "dotenv/config";

const dataFiles = [
    "users.json",
    "books.json",
    "ratings.json",
    "wishlist.json",
    "messages.json",
    "message-threads.json",
    "notifications.json",
    "views.json",
];

dataFiles.forEach((fileName) => {
    const filePath = path.join(__dirname, `../data/${fileName}`);
    if (!require("fs").existsSync(filePath)) {
        FileOps.writeJsonFile(`data/${fileName}`, []);
    }
});

const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = initSocketIO(server);

app.use(
    cors({
        origin: "http://localhost:3000",
        methods: ["GET", "POST", "HEAD", "PUT", "DELETE", "PATCH", "OPTIONS"],
        credentials: true,
    })
);

app.use(
    helmet({
        contentSecurityPolicy:
            process.env.NODE_ENV === "production" ? undefined : false,
    })
);
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(enableServiceWorkerCaching);

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/", (_req, res) => {
    res.json({ message: "P2P Book Exchange API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/viewers", viewerRoutes);
app.use("/api/offline", offlineRoutes);

app.use(notFoundHandler);

app.use(errorHandler);

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
