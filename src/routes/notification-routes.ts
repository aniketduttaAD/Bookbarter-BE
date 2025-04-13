import { Router } from "express";
import { authenticate } from "../middleware/auth-middleware";
import {
    getNotifications,
    getUnreadCount,
    markAllAsRead,
    deleteAllNotifications,
    getNotification,
    markAsRead,
    deleteNotification,
} from "../controllers/notification-controller";

const router = Router();

router.use(authenticate);
router.get("/", getNotifications);
router.get("/unread/count", getUnreadCount);
router.patch("/read-all", markAllAsRead);
router.delete("/", deleteAllNotifications);
router.get("/:id", getNotification);
router.patch("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

export default router;
