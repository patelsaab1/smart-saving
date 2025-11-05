// src/models/Referral.js (Updated for pair tracking)
import mongoose from "mongoose";

const referralSchema = new mongoose.Schema(
  {
    referrer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    referredUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    bonusAwarded: { type: Boolean, default: false }, // direct bonus दिया गया या नहीं
    activatedAt: { type: Date }, // referred user कब active हुआ
  },
  { timestamps: true }
);


export default mongoose.model("Referral", referralSchema);