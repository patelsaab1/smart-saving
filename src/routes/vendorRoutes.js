// routes/vendorRoutes.js
import express from "express";

import {
  addShop,
  uploadRateList,
  getMyShops,
  getActiveShops,
  updateShop,
  deleteShop,
  updateShopDocuments,
  getSingleShop,
} from "../controllers/vendorController.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";
import {
  uploadRateListFiles,
  uploadShopDocs,
} from "../services/cloudinary.js";

const router = express.Router();

/* ----------------------------------------
   🔹 PUBLIC ROUTES
----------------------------------------- */

// Get all active shops
router.get("/shops", getActiveShops);

/* ----------------------------------------
   🔹 VENDOR ROUTES (AUTH REQUIRED)
----------------------------------------- */

// Add new shop
router.post(
  "/shop",
  authMiddleware,
  uploadShopDocs.fields([
    { name: "rentAgreement", maxCount: 1 },
    { name: "licenseDoc", maxCount: 1 },
  ]),
  addShop
);

// Update shop
router.put(
  "/shop/:shopId",
  authMiddleware,
  uploadShopDocs.fields([
    { name: "rentAgreement", maxCount: 1 },
    { name: "licenseDoc", maxCount: 1 },
  ]),
  updateShop
);

// Delete shop (with pending bill protection)
router.delete("/shop/:shopId", authMiddleware, deleteShop);
router.get("/shop/:shopId", authMiddleware, getSingleShop);

// Upload Rate List (Image + Excel)
router.post(
  "/shop/:shopId/rate-list",
  authMiddleware,
  uploadRateListFiles.fields([
    { name: "rateListFile", maxCount: 1 },
    { name: "rateListExcel", maxCount: 1 },
  ]),
  uploadRateList
);

// Update only documents (rent agreement / rate list)
router.put(
  "/shop/:shopId/documents",
  authMiddleware,
  uploadShopDocs.fields([
    { name: "rentAgreement", maxCount: 1 },
    { name: "licenseDoc", maxCount: 1 },
    { name: "rateListFile", maxCount: 1 },
    { name: "rateListExcel", maxCount: 1 },
  ]),
  updateShopDocuments
);

// Get all shops owned by vendor
router.get("/my-shops", authMiddleware, getMyShops);

export default router;
