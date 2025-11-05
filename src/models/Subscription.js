// src/models/Subscription.js
import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // "Plan A", "Plan B"
    code: { type: String, enum: ["A", "B"], unique: true, required: true },
    price: { type: Number, required: true }, // 2400 or 999
    cashback: { type: Number, required: true }, // 500 or 250
    hasReferral: { type: Boolean, default: false }, // true for Plan A
    discountRange: { type: String, default: "1%–40%" },
    description: [String],
    isActive: { type: Boolean, default: true }, // Admin can disable
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("Subscription", subscriptionSchema);