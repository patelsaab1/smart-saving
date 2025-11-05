import express from "express";
import {
  uploadBill,
  approveBill,
  rejectBill,
} from "../controllers/shoppingController.js";

import { adminMiddleware, authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ✅ User uploads shopping bill
router.post("/upload-bill", authMiddleware, uploadBill);


// ✅ Admin approves bill (with cashback + bonuses)
router.patch("/approve-bill/:billId", authMiddleware, adminMiddleware, approveBill);

// ✅ Admin rejects bill
router.patch("/reject-bill/:billId", authMiddleware, adminMiddleware, rejectBill);

export default router;
