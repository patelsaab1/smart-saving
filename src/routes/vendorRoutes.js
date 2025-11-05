import express from "express";
import { authMiddleware, adminMiddleware } from "../middlewares/authMiddleware.js";
import { becomeVendor, addShop ,uploadRateList } from "../controllers/vendorController.js";
import { addProduct, bulkUploadProducts } from "../controllers/productController.js";
// import { uploadAny, uploadMultiple, uploadSingle } from "../middlewares/multerMemory.js";
import { uploadSingle } from "../middlewares/multerMemory.js";
import { shopUpload } from "../middlewares/multerMemory.js";
const router = express.Router();

// Vendor
router.post("/become-vendor", authMiddleware, becomeVendor);
router.post(
  "/add-shop",
  authMiddleware,
  shopUpload,
  addShop,
  
);


// Products
router.post("/products/add", authMiddleware, addProduct);
router.post("/products/bulk-upload", authMiddleware, uploadSingle("file"), bulkUploadProducts);

// Rate List
router.post("/shops/:shopId/upload-rate-list", authMiddleware, uploadSingle("file"), uploadRateList); // handled in vendorController


// Admin Shop actions


export default router;
