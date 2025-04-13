import { Router } from "express";
import {
    getBooks,
    getBookById,
    createBook,
    updateBook,
    deleteBook,
    updateBookStatus,
    getBookViewers,
} from "../controllers/book-controller";
import { authenticate, authorizeRole } from "../middleware/auth-middleware";
import { upload } from "../utils/imageUpload";
import { getBookRatings } from "../controllers/rating-controller";
import { exportBooks, importBooks } from "../controllers/book-import-export-controller";

const router = Router();

router.get("/", getBooks);
router.get("/export", authenticate, exportBooks);
router.get("/:id", getBookById);
router.get("/:id/viewers", getBookViewers);
router.get("/:id/ratings", getBookRatings);
router.post("/import", authenticate, authorizeRole(["owner"]), importBooks);

router.post(
    "/",
    authenticate,
    authorizeRole(["owner"]),
    upload.single("image"),
    createBook
);

router.patch(
    "/:id",
    authenticate,
    upload.single("image"),
    updateBook
);

router.delete(
    "/:id",
    authenticate,
    deleteBook
);

router.patch(
    "/:id/status",
    authenticate,
    updateBookStatus
);

export default router;