// routes/vendorRoutes.js
import express from "express";
import {
  addShop,
  uploadRateList,
  getMyShops,
  getActiveShops,
  updateShop,
  deleteShop,
} from "../controllers/vendorController.js";
import { adminMiddleware, authMiddleware } from "../middlewares/authMiddleware.js";
import { uploadRateListFiles, uploadShopDocs } from "../services/cloudinary.js";
const router = express.Router();

// 🔹 Get active shops (public)
router.get("/shops", getActiveShops);

// 🔹 Vendor add new shop
router.post(
  "/shop",
  authMiddleware,
  uploadShopDocs.fields([
    { name: "rentAgreement", maxCount: 1 },
    { name: "licenseDoc", maxCount: 1 },
  ]),
  addShop
);

// 🔹 Update shop details or documents
router.put(
  "/shop/:shopId",
  authMiddleware,
  uploadShopDocs.fields([
    { name: "rentAgreement", maxCount: 1 },
    { name: "licenseDoc", maxCount: 1 },
  ]),
  updateShop
);

// 🔹 Delete shop
router.delete("/shop/:shopId", authMiddleware, deleteShop);

// 🔹 Upload Rate List (Photo or Excel)
router.post(
  "/shop/:shopId/rate-list",
  authMiddleware,
  uploadRateListFiles.fields([
    { name: "rateListFile", maxCount: 1 },
    { name: "rateListExcel", maxCount: 1 },
  ]),
  uploadRateList
);

// 🔹 Get all my shops (for vendor)
router.get("/my-shops", authMiddleware, getMyShops);

export default router;
