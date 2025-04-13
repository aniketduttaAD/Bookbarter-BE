import { Router } from "express";
import {
    getBookViewers,
    recordBookView,
} from "../controllers/viewer-controller";
import { authenticate } from "../middleware/auth-middleware";

const router = Router();

router.get("/books/:bookId/viewers", getBookViewers);
router.post("/books/:bookId/view", authenticate, recordBookView);

export default router;