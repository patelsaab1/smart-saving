// src/models/BankAccount.js
import mongoose from "mongoose";

const bankAccountSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    accountHolderName: { type: String, required: true },
    accountNumber: { type: String, required: true, match: /^\d{9,18}$/ },
    ifscCode: { type: String, required: true, match: /^[A-Z]{4}0[A-Z0-9]{6}$/ },
    bankName: { type: String, required: true },
    branchName: { type: String },
    upiId: { type: String, match: /^[\w.-]+@[\w.-]+$/ }, // ✅ optional UPI field
    isPrimary: { type: Boolean, default: true },
  },
  { timestamps: true }
);

bankAccountSchema.index({ user: 1 });

export default mongoose.model("BankAccount", bankAccountSchema);
