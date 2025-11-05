// src/models/Payment.js (Updated for Plan A/B amounts)
import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    planType: { type: String, enum: ["A", "B"], required: true }, // Added
    mode: { type: String, enum: ["online", "cash"], required: true },
    amount: { type: Number, required: true }, // 2400 or 999
    status: { type: String, enum: ["pending", "success", "failed"], default: "pending" },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);