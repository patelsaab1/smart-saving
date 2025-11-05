// src/models/Withdrawal.js
import mongoose from "mongoose";

const withdrawalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    bankAccount: { type: mongoose.Schema.Types.ObjectId, ref: "BankAccount"},
     upiId: { type: String }, // ✅ NEW
    amount: { type: Number, required: true, min: 100 },
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED", "PAID"], default: "PENDING" },
    requestedAt: { type: Date, default: Date.now },
    processedAt: { type: Date },
  },
  { timestamps: true }
);

withdrawalSchema.index({ user: 1, requestedAt: -1 });

export default mongoose.model("Withdrawal", withdrawalSchema);
