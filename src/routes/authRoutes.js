import express from "express";
import {
  register,
  sendOtp,
  verifyOtp,
  getProfile,
  updateProfile,
  loginWithPassword,
} from "../controllers/authController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { uploadProfile } from "../services/cloudinary.js";

const router = express.Router();

// 🔹 Public routes
router.post("/register", register);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/login", loginWithPassword); 

// 🔹 Protected routes
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, uploadProfile.single("profilePic"), updateProfile);

export default router;