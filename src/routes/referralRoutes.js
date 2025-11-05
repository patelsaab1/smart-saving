// src/routes/referralRoutes.js (New)
import express from "express";
import { getReferrals } from "../controllers/referralController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getReferrals);

export default router;