import { Router } from "express";
import {
    signup,
    login,
    getProfile,
    updateProfile,
} from "../controllers/auth-controller";
import { authenticate } from "../middleware/auth-middleware";
import { getUserStats } from "../controllers/user-stats-controller";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/stats", authenticate, getUserStats);
router.get("/profile", authenticate, getProfile);
router.patch("/profile", authenticate, updateProfile);

export default router;