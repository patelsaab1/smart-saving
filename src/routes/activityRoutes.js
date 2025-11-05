// src/routes/activityRoutes.js (Updated)
import express from "express";
import { addActivity, redeemPoints } from "../controllers/activityController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, addActivity);
router.post("/redeem", authMiddleware, redeemPoints);

export default router;