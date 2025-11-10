// src/routes/withdrawRoutes.js
import express from "express";
import { requestWithdrawal, getMyWithdrawals, rejectWithdrawal, approveWithdrawal, getPendingRequests } from "../controllers/withdrawalController.js";
import { adminMiddleware, authMiddleware } from "../middlewares/authMiddleware.js";


const router = express.Router();


router.get("/", authMiddleware, getMyWithdrawals);
router.post("/request", authMiddleware, requestWithdrawal);

// Admin Routes
router.get("/all", adminMiddleware, getPendingRequests);
router.put("/approve/:id", adminMiddleware, approveWithdrawal);
router.put("/reject/:id", adminMiddleware, rejectWithdrawal);

export default router;
