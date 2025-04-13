import { Router } from "express";
import {
    getApiMetadata,
    ping,
    getOfflineBundle,
} from "../controllers/offline-controller";
import { authenticate } from "../middleware/auth-middleware";

const router = Router();

// Public routes
router.get("/metadata", getApiMetadata);
router.get("/ping", ping);
router.head("/ping", ping);

// Protected routes
router.get("/bundle", authenticate, getOfflineBundle);

export default router;