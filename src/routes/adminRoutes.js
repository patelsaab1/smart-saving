import express from "express";
import { registerAdmin, loginAdmin ,approveRateList,updateShopStatus, getAllShops, approveShop, rejectShop } from "../controllers/adminController.js";
const router = express.Router();
import { adminMiddleware } from "../middlewares/authMiddleware.js";
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);


// ✅ Get all shops 
router.get("/shops", adminMiddleware, getAllShops);
router.put("/shops/:shopId/approve", adminMiddleware, approveShop);
router.put("/shops/:shopId/reject", adminMiddleware, rejectShop);
router.put("/shops/:shopId/approve-rate-list", adminMiddleware, approveRateList);
router.put("/shops/:shopId/status", adminMiddleware, updateShopStatus);

export default router;