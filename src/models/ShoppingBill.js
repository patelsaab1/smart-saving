import mongoose from "mongoose";

const shoppingBillSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true }, // Changed to shop ref
    billAmount: { type: Number, required: true },
    cashbackAmount: { type: Number, default: 0 }, // Set by admin during approval
    billImage: { type: String }, // Cloudinary URL
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    approvedAt: { type: Date },
    referrerBonusProcessed: { type: Boolean, default: false }, // To track 2% bonus
    firstCashbackProcessed: { type: Boolean, default: false }, // To track first shopping cashback
  },
  { timestamps: true }
);

export default mongoose.model("ShoppingBill", shoppingBillSchema);