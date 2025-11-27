import express from "express";
import {
  initiateOnlinePayment,
  verifyOnlinePayment,
  requestCashActivation,
  approveCashActivation,
  PendingCashRequests,
  razorpayWebhook,
} from "../controllers/paymentController.js";
import { adminMiddleware, authMiddleware } from "../middlewares/authMiddleware.js";


const router = express.Router();

// User Routes
router.post("/online/initiate", authMiddleware, initiateOnlinePayment);
router.post("/online/verify", authMiddleware, verifyOnlinePayment);
router.post("/razorpay/webhook", razorpayWebhook);
router.post("/cash/request", authMiddleware, requestCashActivation);

// Admin Route
router.get("/cash/request/", adminMiddleware, PendingCashRequests);
router.post("/request/approve/:userId/:paymentId", adminMiddleware, approveCashActivation);

export default router;
