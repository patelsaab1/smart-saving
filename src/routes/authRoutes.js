import express from "express";
import {
  register,
  sendOtp,
  verifyOtp,
  getProfile,
  updateProfile,
  loginWithPassword,
  registerVendor,
  becomeVendor,
} from "../controllers/authController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { uploadProfile, uploadVendorAll } from "../services/cloudinary.js";

const router = express.Router();

// 🔹 Public routes
router.post("/register", register);
router.post("/register/vendor", registerVendor);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/login", loginWithPassword); 

// 🔹 Protected routes
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, uploadProfile.single("profilePic"), updateProfile);

// vendor profile + KYC
router.post(
  "/become-vendor",
  authMiddleware,
  uploadVendorAll.fields([
    { name: "pan", maxCount: 1 },
    { name: "gst", maxCount: 1 },
    { name: "license", maxCount: 1 },
  ]),
  becomeVendor
);

export default router; 