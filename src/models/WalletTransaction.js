import mongoose from "mongoose";

const walletTransactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true }, // + credit, - debit
    balanceAfter: { type: Number, required: true }, // Snapshot after transaction

    type: { type: String, enum: ["CREDIT", "DEBIT"], required: true },
    action: { type: String, required: true }, // e.g., referral_bonus, withdrawal, plan_activation 
    // enum: [
    //     "activation_cashback",
    //     "shopping_cashback",
    //     "first_shopping_cashback",
    //     "referral_bonus",
    //     "pair_bonus",
    //     "redeem_points",
    //     "withdrawal",
    //  referenceModel: { type: String, enum: ["ShoppingBill", "Withdrawal", "User", "Payment"] },

    referenceId: { type: mongoose.Schema.Types.ObjectId },
    referenceModel: { type: String },
     status: { type: String, enum: ["pending", "completed", "failed"], default: "completed" },
    description: String
  },
  { timestamps: true }
);

export default mongoose.model("WalletTransaction", walletTransactionSchema);
