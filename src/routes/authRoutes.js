import express from "express";
import {
  register,
  sendOtp,
  verifyOtp,
  getProfile,
  updateProfile,
  loginWithPassword,
  registerVendor,
} from "../controllers/authController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { uploadProfile, uploadVendor, uploadVendorKyc } from "../services/cloudinary.js";

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

router.put(
  "/vendor/profile",
  authMiddleware,
  uploadVendor.single("businessLogo"), // shop logo
  uploadVendorKyc.fields([
    { name: "pan", maxCount: 1 },
    { name: "gst", maxCount: 1 },
    { name: "license", maxCount: 1 }
  ]),
  updateProfile
);

export default router; 