import express from "express";
import { registerAdmin, loginAdmin ,approveRateList,updateShopStatus, getAllShops, approveShop, rejectShop, getUsers, toggleUserStatus, toggleSubscriptionStatus, getShopFullDetails, getAdminOverviewStats, getAdminRevenueStats, getAdminWalletStats, getAdminWithdrawalStats, getUserDetailsById, changeAdminPassword, updateAdminProfile, getAdminProfile } from "../controllers/adminController.js";
const router = express.Router();
import { adminMiddleware } from "../middlewares/authMiddleware.js";
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);

router.get("/profile", adminMiddleware, getAdminProfile);
router.put("/profile", adminMiddleware, updateAdminProfile);
router.put("/change-password", adminMiddleware, changeAdminPassword);
// ✅ Get all shops 
router.get("/shops", getAllShops);
router.put("/shops/:shopId/approve", adminMiddleware, approveShop);
router.put("/shops/:shopId/reject", adminMiddleware, rejectShop);
router.put("/shops/:shopId/approve-rate-list", adminMiddleware, approveRateList);
router.put("/shops/:shopId/status", adminMiddleware, updateShopStatus);

router.get("/overview", getAdminOverviewStats);
router.get("/revenue", adminMiddleware, getAdminRevenueStats);
router.get("/wallet", adminMiddleware, getAdminWalletStats);
router.get("/withdrawals", adminMiddleware, getAdminWithdrawalStats);

router.get("/shop/:shopId/details", getShopFullDetails);
// User toggle: active / inactive
router.get("/users/", adminMiddleware, getUsers);
router.get("/users/:userId/", adminMiddleware, getUserDetailsById);
router.patch("/user/:id/toggle", adminMiddleware, toggleUserStatus);
router.patch("/subscription/:id/toggle", adminMiddleware, toggleSubscriptionStatus);


export default router;