import { Router } from "express";
import {
    getThreads,
    getThread,
    getThreadMessages,
    createThread,
    getOrCreateThreadForBook,
    sendMessage,
    markMessageAsRead,
    markThreadAsRead,
    getUnreadCountForUser
} from "../controllers/message-controller";
import { authenticate } from "../middleware/auth-middleware";

const router = Router();

router.use(authenticate);

router.get("/threads", getThreads);
router.get("/threads/:threadId", getThread);
router.get("/threads/:threadId/messages", getThreadMessages);
router.post("/threads", createThread);
router.post("/threads/book", getOrCreateThreadForBook);
router.post("/threads/:threadId/messages", sendMessage);
router.patch("/threads/:threadId/read", markThreadAsRead);
router.patch("/messages/:messageId/read", markMessageAsRead);
router.get("/unread/count", getUnreadCountForUser);

export default router;