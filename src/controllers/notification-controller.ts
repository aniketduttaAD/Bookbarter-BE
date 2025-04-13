import { Request, Response, NextFunction } from "express";
import { NotificationModel } from "../models/notification-model";
import { ApiError } from "../middleware/error-middleware";

export const getNotifications = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new ApiError(401, "Unauthorized");
        }

        const notifications = NotificationModel.getByUserId(userId);
        res.status(200).json(notifications);
    } catch (error) {
        next(error);
    }
};

export const getNotification = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new ApiError(401, "Unauthorized");
        }

        const { id } = req.params;
        const notification = NotificationModel.getById(id);

        if (!notification) {
            throw new ApiError(404, "Notification not found");
        }

        if (notification.userId !== userId) {
            throw new ApiError(403, "Forbidden");
        }

        res.status(200).json(notification);
    } catch (error) {
        next(error);
    }
};

export const markAsRead = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new ApiError(401, "Unauthorized");
        }

        const { id } = req.params;
        const notification = NotificationModel.getById(id);

        if (!notification) {
            throw new ApiError(404, "Notification not found");
        }

        if (notification.userId !== userId) {
            throw new ApiError(403, "Forbidden");
        }

        const success = NotificationModel.markAsRead(id);

        if (!success) {
            throw new ApiError(500, "Failed to mark notification as read");
        }

        res.status(200).json({ message: "Notification marked as read" });
    } catch (error) {
        next(error);
    }
};

export const markAllAsRead = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new ApiError(401, "Unauthorized");
        }

        const count = NotificationModel.markAllAsRead(userId);
        res.status(200).json({ count, message: `${count} notifications marked as read` });
    } catch (error) {
        next(error);
    }
};

export const deleteNotification = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new ApiError(401, "Unauthorized");
        }

        const { id } = req.params;
        const notification = NotificationModel.getById(id);

        if (!notification) {
            throw new ApiError(404, "Notification not found");
        }

        if (notification.userId !== userId) {
            throw new ApiError(403, "Forbidden");
        }

        const success = NotificationModel.delete(id);

        if (!success) {
            throw new ApiError(500, "Failed to delete notification");
        }

        res.status(200).json({ message: "Notification deleted" });
    } catch (error) {
        next(error);
    }
};

export const deleteAllNotifications = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new ApiError(401, "Unauthorized");
        }

        const count = NotificationModel.deleteAllForUser(userId);
        res.status(200).json({ count, message: `${count} notifications deleted` });
    } catch (error) {
        next(error);
    }
};

export const getUnreadCount = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new ApiError(401, "Unauthorized");
        }

        const count = NotificationModel.getUnreadCountForUser(userId);
        res.status(200).json({ count });
    } catch (error) {
        next(error);
    }
};
