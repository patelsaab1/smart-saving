import express from "express";
import {
  initiateOnlinePayment,
  verifyOnlinePayment,
  requestCashActivation,
  approveCashActivation,
} from "../controllers/paymentController.js";
import { adminMiddleware, authMiddleware } from "../middlewares/authMiddleware.js";


const router = express.Router();

// User Routes
router.post("/online/initiate", authMiddleware, initiateOnlinePayment);
router.post("/online/verify", authMiddleware, verifyOnlinePayment);
router.post("/cash/request", authMiddleware, requestCashActivation);

// Admin Route
router.post("/cash/approve/:userId", authMiddleware, adminMiddleware, approveCashActivation);

export default router;
