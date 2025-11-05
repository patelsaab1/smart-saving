import express from "express";
import { registerAdmin, loginAdmin ,approveRateList,updateShopStatus } from "../controllers/adminController.js";
const router = express.Router();
import { adminMiddleware } from "../middlewares/authMiddleware.js";
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.put("/shops/:shopId/approve-rate-list", adminMiddleware, approveRateList);
router.put("/shops/:shopId/status", adminMiddleware, updateShopStatus);

export default router;