// src/routes/referralRoutes.js (Updated)
import express from "express";
import { getReferrals, getReferralAnalytics } from "../controllers/referralController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getReferrals);
router.get("/analytics", authMiddleware, getReferralAnalytics);

export default router;