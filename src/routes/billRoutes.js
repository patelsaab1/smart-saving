import express from "express";
import { uploadBill, myBills, allBills, approveBill, rejectBill } from "../controllers/userBillController.js";
import { upload } from "../services/cloudinary.js";
import { adminMiddleware, authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// User
router.post("/", authMiddleware, upload.single("billImage"), uploadBill);
router.get("/me", authMiddleware, myBills);

// Admin
router.get("/", authMiddleware, adminMiddleware, allBills);
router.put("/:billId/approve", authMiddleware, adminMiddleware, approveBill);
router.put("/:billId/reject", authMiddleware, adminMiddleware, rejectBill);

export default router;
