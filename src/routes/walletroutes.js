import express from "express";
import { getWalletDetails, addBankAccount, updateBankAccount, getWalletAnalytics, Bank } from "../controllers/walletController.js";
import {  authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getWalletDetails);
router.get("/bank", authMiddleware, Bank);
router.post("/bank/add", authMiddleware, addBankAccount);
router.put("/bank/update/:id", authMiddleware, updateBankAccount);

router.get("/analytics", authMiddleware, getWalletAnalytics);


export default router;
