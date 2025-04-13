import { Router } from "express";
import {
    getWishlist,
    getWishlistItem,
    addWishlistItem,
    deleteWishlistItem,
    addBookToWishlist,
    checkBookInWishlist,
} from "../controllers/wishlist-controller";
import { authenticate, authorizeRole } from "../middleware/auth-middleware";

const router = Router();

router.use(authenticate);

router.use(authorizeRole(["seeker"]));

router.get("/", getWishlist);
router.get("/:id", getWishlistItem);
router.post("/", addWishlistItem);
router.delete("/:id", deleteWishlistItem);
router.post("/books/:bookId", addBookToWishlist);
router.get("/check/:bookId", checkBookInWishlist);

export default router;