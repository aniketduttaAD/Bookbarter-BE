import { Router } from "express";
import {
    getRatings,
    getRatingById,
    getBookRatings,
    getOwnerRatings,
    getUserRatingForBook,
    createRating,
    deleteRating,
} from "../controllers/rating-controller";
import { authenticate } from "../middleware/auth-middleware";

const router = Router();

router.get("/", getRatings);
router.get("/:id", getRatingById);
router.get("/book/:bookId", getBookRatings);
router.get("/owner/:ownerId", getOwnerRatings);
router.get("/user/book/:bookId", authenticate, getUserRatingForBook);
router.post("/", authenticate, createRating);
router.delete("/:id", authenticate, deleteRating);

export default router;
