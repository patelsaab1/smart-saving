import mongoose from "mongoose";
import { generateReferralCode } from "../utils/referralCode.js";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, unique: true },
    password: { type: String },

    // ✅ FIXED: No duplicate index definition, sparse works properly now
    referralCode: {
      type: String,
      unique: true,
      sparse: true, // only indexes when field exists
      default: undefined,
    },

    referredBy: { type: String }, // referralCode of referrer
    planType: { type: String, enum: ["A", "B", "none"], default: "none" },

    redeemPoints: { type: Number, default: 0 },
    role: { type: String, enum: ["user", "vendor", "admin"], default: "user" },
    dob: { type: Date },
    gender: { type: String, enum: ["male", "female", "other"] },
    profilePic: { type: String },

    kycDocuments: {
      pan: String,
      gst: String,
      license: String,
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zip: String,
    },

    isActive: { type: Boolean, default: false },
    activatedAt: { type: Date },
    firstShoppingCashbackClaimed: { type: Boolean, default: false },

    referralCount: { type: Number, default: 0 },
    pairCount: { type: Number, default: 0 },

    rewards: [
      {
        type: { type: String },
        awardedAt: { type: Date, default: Date.now },
      },
    ],

    otp: { type: String, select: false },
    otpExpiry: { type: Date, select: false },
  },
  { timestamps: true }
);

// ✅ FIXED HOOK
userSchema.pre("save", function (next) {
  if (!this.referralCode) {
    this.referralCode = generateReferralCode();
  }
  next();
});

// ✅ keep only meaningful indexes
// userSchema.index({ email: 1 });
// userSchema.index({ phone: 1 });
// userSchema.index({ referralCode: 1 }, { unique: true, sparse: true });

export default mongoose.model("User", userSchema);
