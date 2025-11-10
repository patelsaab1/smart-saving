// src/models/ShoppingBill.js (Updated)
import mongoose from "mongoose";

const shoppingBillSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
  billAmount: { type: Number, required: true, min: 1 },
  cashbackAmount: { type: Number, default: 0 },
  billImage: { type: String, required: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  approvedAt: Date,
  firstCashbackProcessed: { type: Boolean, default: false },
  referrerBonusProcessed: { type: Boolean, default: false },
  vendorProfitProcessed: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("ShoppingBill", shoppingBillSchema);