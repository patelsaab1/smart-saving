import express from "express";
import { getWalletDetails, addBankAccount, requestWithdrawal, approveWithdrawal, updateBankAccount, rejectWithdrawal, getWalletAnalytics, Bank } from "../controllers/walletController.js";
import { adminMiddleware, authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getWalletDetails);
router.get("/bank", authMiddleware, Bank);
router.post("/bank/add", authMiddleware, addBankAccount);
router.put("/bank/update/:id", authMiddleware, updateBankAccount);
router.post("/withdraw", authMiddleware, requestWithdrawal);
router.get("/analytics", authMiddleware, getWalletAnalytics);
// Admin Routes
router.put("/approve/:id", adminMiddleware, approveWithdrawal);
router.put("/reject/:id", adminMiddleware, rejectWithdrawal);

export default router;
