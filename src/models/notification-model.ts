import { v4 as uuidv4 } from "uuid";
import { FileOps } from "../utils/fileOps";
import { Notification } from "../types";

const NOTIFICATIONS_FILE_PATH = "data/notifications.json";

export const NotificationModel = {
    getByUserId: (userId: string): Notification[] => {
        const notifications = FileOps.readJsonFile<Notification>(NOTIFICATIONS_FILE_PATH);
        return notifications
            .filter((notification) => notification.userId === userId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },

    getById: (id: string): Notification | null => {
        const notifications = FileOps.readJsonFile<Notification>(NOTIFICATIONS_FILE_PATH);
        return notifications.find((notification) => notification.id === id) || null;
    },

    create: (
        userId: string,
        data: {
            title: string;
            message: string;
            type: Notification["type"];
            link?: string;
        }
    ): Notification => {
        const notifications = FileOps.readJsonFile<Notification>(NOTIFICATIONS_FILE_PATH);

        const now = new Date().toISOString();
        const newNotification: Notification = {
            id: uuidv4(),
            userId,
            title: data.title,
            message: data.message,
            type: data.type,
            link: data.link,
            read: false,
            createdAt: now,
        };

        notifications.push(newNotification);
        FileOps.writeJsonFile(NOTIFICATIONS_FILE_PATH, notifications);

        return newNotification;
    },

    markAsRead: (id: string): boolean => {
        const notifications = FileOps.readJsonFile<Notification>(NOTIFICATIONS_FILE_PATH);
        const index = notifications.findIndex((notification) => notification.id === id);

        if (index === -1) {
            return false;
        }

        notifications[index].read = true;
        FileOps.writeJsonFile(NOTIFICATIONS_FILE_PATH, notifications);

        return true;
    },

    markAllAsRead: (userId: string): number => {
        const notifications = FileOps.readJsonFile<Notification>(NOTIFICATIONS_FILE_PATH);
        let count = 0;

        const updatedNotifications = notifications.map((notification) => {
            if (notification.userId === userId && !notification.read) {
                count++;
                return {
                    ...notification,
                    read: true,
                };
            }
            return notification;
        });

        FileOps.writeJsonFile(NOTIFICATIONS_FILE_PATH, updatedNotifications);

        return count;
    },

    delete: (id: string): boolean => {
        const notifications = FileOps.readJsonFile<Notification>(NOTIFICATIONS_FILE_PATH);
        const filteredNotifications = notifications.filter((notification) => notification.id !== id);

        if (filteredNotifications.length === notifications.length) {
            return false;
        }

        FileOps.writeJsonFile(NOTIFICATIONS_FILE_PATH, filteredNotifications);

        return true;
    },

    deleteAllForUser: (userId: string): number => {
        const notifications = FileOps.readJsonFile<Notification>(NOTIFICATIONS_FILE_PATH);
        const filteredNotifications = notifications.filter((notification) => notification.userId !== userId);

        const deletedCount = notifications.length - filteredNotifications.length;

        FileOps.writeJsonFile(NOTIFICATIONS_FILE_PATH, filteredNotifications);

        return deletedCount;
    },

    getUnreadCountForUser: (userId: string): number => {
        const notifications = FileOps.readJsonFile<Notification>(NOTIFICATIONS_FILE_PATH);
        return notifications.filter(
            (notification) => notification.userId === userId && !notification.read
        ).length;
    },

    cleanupOldNotifications: (): number => {
        const notifications = FileOps.readJsonFile<Notification>(NOTIFICATIONS_FILE_PATH);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const filteredNotifications = notifications.filter(
            (notification) => new Date(notification.createdAt) > thirtyDaysAgo
        );

        const deletedCount = notifications.length - filteredNotifications.length;

        FileOps.writeJsonFile(NOTIFICATIONS_FILE_PATH, filteredNotifications);

        return deletedCount;
    },
};
