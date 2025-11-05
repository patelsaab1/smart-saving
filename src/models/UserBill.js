import mongoose from "mongoose";

const userBillSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    billType: { type: String, required: true },
    amount: { type: Number, required: true },
    billImage: { type: String, required: true },      // Cloudinary URL
    imagePublicId: { type: String },                  // For deletion
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    rewardCoins: { type: Number, default: 0 },
    rewardCash: { type: Number, default: 0 },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("UserBill", userBillSchema);


// 👉 जब user bill upload करेगा, उसका proof + amount save होगा। Admin approve करेगा तो reward मिलेगा।

// User bill upload करेगा (billImage + amount + billType)।
// Status default → pending होगा।
// Admin panel से approve/reject होगा।
// अगर approved →
// यूज़र को reward coins/cash मिलेंगे।
// User.wallets.cash या User.wallets.bonus auto-update होगा।
// एक entry UserActivity में भी जाएगी → type = "bill_upload".