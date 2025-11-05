import Admin from "../models/Admin.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import apiResponse from "../utils/apiResponse.js";
import Shop from "../models/Shop.js";

// Register Admin
export const registerAdmin = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json(apiResponse({ success: false, message: "Missing required fields" }));
    }
    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(400).json(apiResponse({ success: false, message: "Admin already exists" }));
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new Admin({
      name,
      email,
      phone,
      password: hashedPassword,
      role: role || "admin",
    });
    await admin.save();
    return res.status(201).json(apiResponse({ success: true, message: "Admin registered successfully" }));
  } catch (err) {
    console.error("❌ Admin Register Error:", err);
    return res.status(500).json(apiResponse({ success: false, message: "Server error" }));
  }
};

// Login Admin
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email }).select("+password");
    if (!admin) {
      return res.status(404).json(apiResponse({ success: false, message: "Admin not found" }));
    }
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json(apiResponse({ success: false, message: "Invalid credentials" }));
    }
    const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return res.json(apiResponse({
      success: true,
      message: "Login successful",
      data: {
        token,
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
      },
    }));
  } catch (err) {
    console.error("❌ Admin Login Error:", err);
    return res.status(500).json(apiResponse({ success: false, message: "Server error" }));
  }
};
export const approveRateList = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { action } = req.body; // expected: approve | reject

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json(apiResponse({ success: false, message: "Invalid action" }));
    }

    const shop = await Shop.findById(shopId);
    if (!shop) return res.status(404).json(apiResponse({ success: false, message: "Shop not found" }));

    shop.rateListStatus = action === "approve" ? "approved" : "rejected";
    await shop.save();

    return res.json(apiResponse({ message: `Rate list ${shop.rateListStatus}`, data: shop }));
  } catch (err) {
    console.error("❌ Approve Rate List Error:", err);
    return res.status(500).json(apiResponse({ success: false, message: "Server error" }));
  }
};

export const updateShopStatus = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { status } = req.body; // expected: active | inactive | blocked

    if (!["active", "inactive", "blocked"].includes(status)) {
      return res.status(400).json(apiResponse({ success: false, message: "Invalid status" }));
    }

    const shop = await Shop.findById(shopId);
    if (!shop) return res.status(404).json(apiResponse({ success: false, message: "Shop not found" }));

    shop.status = status;
    await shop.save();

    return res.json(apiResponse({ message: `Shop status updated to ${status}`, data: shop }));
  } catch (err) {
    console.error("❌ Update Shop Status Error:", err);
    return res.status(500).json(apiResponse({ success: false, message: "Server error" }));
  }
};