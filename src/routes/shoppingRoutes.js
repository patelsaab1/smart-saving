// src/routes/shoppingRoutes.js (New/Updated)
import express from "express";
import { uploadBill, approveBill, rejectBill, myBills, getBillAnalytics, getAllBillsAdmin, vendorBillEntries, vendorOwedAmount, vendorPaymentHistory ,vendorProfitHistory, vendorPendingProfitDetails} from "../controllers/shoppingController.js";
import { authMiddleware, adminMiddleware } from "../middlewares/authMiddleware.js";

import { uploadBillimage } from "../services/cloudinary.js";

const router = express.Router();

router.post(
  "/upload",
  authMiddleware,
  uploadBillimage.single("billImage"),
  uploadBill
);


router.get("/admin/bills", adminMiddleware, getAllBillsAdmin);
router.patch("/bill/approve/:billId", adminMiddleware, approveBill);
router.patch("/reject/:billId", adminMiddleware, rejectBill);
router.get("/my-bills", authMiddleware, myBills);


router.get("/vendor/shop-bill", authMiddleware, vendorBillEntries);
router.get("/vendor/owed", authMiddleware, vendorOwedAmount);
router.get("/vendor/payment-history", authMiddleware, vendorPaymentHistory);
router.get("/vendor/payment-pending", authMiddleware, vendorPendingProfitDetails);
router.get("/vendor/payment-profit", authMiddleware, vendorProfitHistory);
router.get("/dashboard/summary", authMiddleware, getBillAnalytics);
// router.post("/admin/mark-paid/:vendorId", adminMiddleware, markVendorPaid);

export default router;