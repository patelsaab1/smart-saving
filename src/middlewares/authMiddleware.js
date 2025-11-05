// src/middlewares/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Admin from "../models/Admin.js";

const authMiddleware = async (req, res, next) => {
 

  const authHeader = req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token, authorization denied" });
  }

  // Extract token from "Bearer <token>"
  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log("Decoded Token:", decoded);

    // Attach user object (excluding sensitive fields)
    req.user = await User.findById(decoded.id).select("-password -otp -otpExpiry");
    // console.log("Authenticated User:", req.user);
    if (!req.user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export const adminMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(403).json({ success: false, message: "Admin not found" });
    }
    if (admin.role !== "admin" && admin.role !== "superadmin") {
      return res.status(403).json({ success: false, message: "Not authorized as admin" });
    }

    req.user = admin;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

export { authMiddleware };
