import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

const adminMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const admin = await Admin.findById(decoded.id);
    if (!admin || (admin.role !== "admin" && admin.role !== "superadmin")) {
      return res.status(403).json({ success: false, message: "Not authorized as admin" });
    }

    req.admin = admin;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

export default adminMiddleware;