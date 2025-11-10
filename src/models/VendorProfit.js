// src/models/VendorProfit.js (New)
import mongoose from "mongoose";

const vendorProfitSchema = new mongoose.Schema({
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  bill: { type: mongoose.Schema.Types.ObjectId, ref: "ShoppingBill", required: true },
  amount: { type: Number, required: true }, // Profit = cashbackAmount
  status: { type: String, enum: ["pending", "paid"], default: "pending" },
  paidAt: Date,
  paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

export default mongoose.model("VendorProfit", vendorProfitSchema);