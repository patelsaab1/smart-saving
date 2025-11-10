import express from "express";
import { 
  becomeVendor, 
  addShop, 
  uploadRateList, 
  getMyShops,
  getActiveShops,
  updateShop,
  deleteShop,
   
} from "../controllers/vendorController.js";
import { authMiddleware, adminMiddleware } from "../middlewares/authMiddleware.js";
import { uploadMultiple } from "../middlewares/multerMemory.js";

const router = express.Router();


router.post("/become-vendor", uploadMultiple([
  { name: "pan", maxCount: 1 },
  { name: "gst", maxCount: 1 },
  { name: "license", maxCount: 1 }
]), becomeVendor);

router.get("/shops", getActiveShops);

router.post("/shop", authMiddleware, uploadMultiple([
  { name: "rentAgreement", maxCount: 1 },
  { name: "licenseDoc", maxCount: 1 }
]), addShop);
// vendorRoutes.js
router.put("/shop/:shopId", authMiddleware, uploadMultiple([
  { name: "rentAgreement", maxCount: 1 },
  { name: "licenseDoc", maxCount: 1 }
]), updateShop);
router.delete("/shop/:shopId", authMiddleware, deleteShop);

router.post("/shop/:shopId/rate-list", authMiddleware, uploadMultiple([
  { name: "rateListFile", maxCount: 1 },
  { name: "rateListExcel", maxCount: 1 }
]), uploadRateList);

router.get("/my-shops", authMiddleware, getMyShops);

export default router;