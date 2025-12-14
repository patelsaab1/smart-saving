import Admin from "../models/Admin.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import apiResponse from "../utils/apiResponse.js";
import Shop from "../models/Shop.js";
import User from "../models/User.js";
import UserSubscription from "../models/UserSubscription.js";
import ShoppingBill from "../models/ShoppingBill.js";
import VendorProfit from "../models/VendorProfit.js";
import Payment from "../models/Payment.js";
import WalletTransaction from "../models/WalletTransaction.js";
import Withdrawal from "../models/Withdrawal.js";


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
    // console.log("admin rohit patel ")
    const admin = await Admin.findOne({ email }).select("+password");
    if (!admin) {
      return res.status(404).json(apiResponse({ success: false, message: "Admin not found" }));
    }
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json(apiResponse({ success: false, message: "Invalid credentials" }));
    }
    const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: "30d" });
    // console.log(token)
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

export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("+password +otp +otpExpiry");
    return res.json(
      apiResponse({
        success: true,
        message: 'Profile fetched',
        data: users
      }));
  } catch (err) {
    console.error('❌ Get users Error:', err);
    return res
      .status(500)
      .json(apiResponse({ success: false, message: 'Server error' }));
  }
};
// Toggle User Active / Block
export const toggleUserStatus = async (req, res) => {
  try {
    const { status } = req.body; // "active" or "inactive"

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json(apiResponse({
        success: false,
        message: "Invalid status value. Use 'active' or 'inactive'."
      }));
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json(apiResponse({
        success: false,
        message: "User not found"
      }));
    }

    user.isActive = status === "active";
    await user.save();

    return res.json(apiResponse({
      success: true,
      message: `User ${status === "active" ? "unblocked" : "blocked"} successfully`,
      data: user
    }));
  } catch (err) {
    console.error("❌ Toggle User Error:", err);
    return res.status(500).json(apiResponse({
      success: false,
      message: "Server error"
    }));
  }
};

// Toggle Subscription active / inactive
export const toggleSubscriptionStatus = async (req, res) => {
  try {
    const { status } = req.body; // "active" or "inactive"

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json(apiResponse({
        success: false,
        message: "Invalid status value. Use 'active' or 'inactive'."
      }));
    }

    const sub = await UserSubscription.findById(req.params.id);

    if (!sub) {
      return res.status(404).json(apiResponse({
        success: false,
        message: "Subscription not found"
      }));
    }

    sub.status = status;

    if (status === "active") {
      sub.activatedAt = new Date();
    }

    await sub.save();

    return res.json(apiResponse({
      success: true,
      message: `Subscription ${status === "active" ? "activated" : "deactivated"} successfully`,
      data: sub
    }));
  } catch (err) {
    console.error("❌ Toggle Subscription Error:", err);
    return res.status(500).json(apiResponse({
      success: false,
      message: "Server error"
    }));
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
    shop.status= "active";
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

export const getAllShops = async (req, res) => {
  try {
    const { status } = req.query;

    const filter = {};
    if (status && status !== "all") filter.status = status;

    const shops = await Shop.find(filter)
      .populate("owner", "name email phone")
      .sort({ createdAt: -1 });

    return res.json(
      apiResponse({
        success: true,
        message: "All shops fetched successfully",
        data: shops,
      })
    );
  } catch (err) {
    console.error("❌ getAllShops error:", err);
    res
      .status(500)
      .json(apiResponse({ success: false, message: "Server error" }));
  }
};


export const getShopFullDetails = async (req, res) => {
  try {
    const { shopId } = req.params;

    // 🔹 Find Shop
    const shop = await Shop.findById(shopId)
      .populate("owner", "name email phoneNumber role");

    if (!shop) {
      return res.status(404).json(apiResponse({
        success: false,
        message: "Shop not found"
      }));
    }

    // 🔹 Find All Bills for this shop
    const bills = await ShoppingBill.find({ shop: shopId })
      .populate("user", "name email phoneNumber")
      .sort({ createdAt: -1 });

    // 🔹 Vendor Profit Records
    const vendorProfits = await VendorProfit.find({ vendor: shop.owner._id })
      .populate("bill", "billAmount createdAt status");

    // 🔹 Calculate Summary
    const summary = {
      totalBills: bills.length,
      pendingBills: bills.filter(b => b.status === "pending").length,
      approvedBills: bills.filter(b => b.status === "approved").length,
      rejectedBills: bills.filter(b => b.status === "rejected").length,

      totalBillAmount: bills.reduce((sum, b) => sum + b.billAmount, 0),
      totalCashbackGiven: bills.reduce((sum, b) => sum + (b.cashbackAmount || 0), 0),

      vendorPendingAmount: vendorProfits
        .filter(v => v.status === "pending")
        .reduce((sum, v) => sum + v.amount, 0),

      vendorPaidAmount: vendorProfits
        .filter(v => v.status === "paid")
        .reduce((sum, v) => sum + v.amount, 0),
    };

    return res.json(apiResponse({
      success: true,
      message: "Shop full details fetched",
      data: {
        shop,
        owner: shop.owner,
        summary,
        bills,
        vendorProfits
      }
    }));

  } catch (err) {
    console.error("Shop Details Error:", err);

    return res.status(500).json(apiResponse({
      success: false,
      message: "Server error"
    }));
  }
};
// ✅ Approve a shop
export const approveShop = async (req, res) => {
  try {
    const { shopId } = req.params;
    const adminId = req.user._id;

    const shop = await Shop.findById(shopId);
    if (!shop)
      return res
        .status(404)
        .json(apiResponse({ success: false, message: "Shop not found" }));

    shop.status = "active";
    shop.rateListStatus = "approved";
    shop.approvedBy = adminId;
    shop.approvedAt = new Date();
    await shop.save();

    return res.json(
      apiResponse({
        success: true,
        message: "Shop approved successfully ✅",
        data: shop,
      })
    );
  } catch (err) {
    console.error("❌ approveShop error:", err);
    res
      .status(500)
      .json(apiResponse({ success: false, message: "Server error" }));
  }
};

// ✅ Reject or block a shop
export const rejectShop = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { reason } = req.body;

    const shop = await Shop.findById(shopId);
    if (!shop)
      return res
        .status(404)
        .json(apiResponse({ success: false, message: "Shop not found" }));

    shop.status = "blocked";
    await shop.save();

    return res.json(
      apiResponse({
        success: true,
        message: `Shop blocked${reason ? `: ${reason}` : ""}`,
        data: shop,
      })
    );
  } catch (err) {
    console.error("❌ rejectShop error:", err);
    res
      .status(500)
      .json(apiResponse({ success: false, message: "Server error" }));
  }
};


export const getAdminOverviewStats = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      planAUsers,
      planBUsers,
      vendors,
      activeShops,
      totalShops
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      User.countDocuments({ planType: "A" }),
      User.countDocuments({ planType: "B" }),
      User.countDocuments({ role: "vendor" }),
      Shop.countDocuments({ status: "active" }),
      Shop.countDocuments()
    ]);

    return res.json(apiResponse({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        planAUsers,
        planBUsers,
        vendors,
        totalShops,
        activeShops
      }
    }));
  } catch (err) {
    return res.status(500).json(apiResponse({
      success: false,
      message: "Server error"
    }));
  }
};



export const getAdminRevenueStats = async (req, res) => {
  try {
    const revenue = await Payment.aggregate([
      { $match: { status: "success" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
          onlineRevenue: {
            $sum: { $cond: [{ $eq: ["$mode", "online"] }, "$amount", 0] }
          },
          cashRevenue: {
            $sum: { $cond: [{ $eq: ["$mode", "cash"] }, "$amount", 0] }
          },
        }
      }
    ]);

    return res.json(apiResponse({
      success: true,
      data: revenue[0] || {
        totalRevenue: 0,
        onlineRevenue: 0,
        cashRevenue: 0,
      }
    }));
  } catch (err) {
    return res.status(500).json(apiResponse({ success: false, message: "Server error" }));
  }
};


export const getAdminWalletStats = async (req, res) => {
  try {
    const walletStats = await WalletTransaction.aggregate([
      {
        $group: {
          _id: "$action",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        }
      }
    ]);

    const totalCredited = await WalletTransaction.aggregate([
      { $match: { type: "CREDIT" } },
      { $group: { _id: null, amount: { $sum: "$amount" } } }
    ]);

    return res.json(apiResponse({
      success: true,
      data: {
        breakdown: walletStats,
        totalCredited: totalCredited[0]?.amount || 0,
      }
    }));
  } catch (err) {
    return res.status(500).json(apiResponse({ success: false, message: "Server error" }));
  }
};

export const getAdminWithdrawalStats = async (req, res) => {
  try {
    const stats = await Withdrawal.aggregate([
      {
        $group: {
          _id: "$status",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        }
      }
    ]);

    return res.json(apiResponse({
      success: true,
      data: stats,
    }));
  } catch (err) {
    return res.status(500).json(apiResponse({ success: false, message: "Server error" }));
  }
};