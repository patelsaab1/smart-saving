// src/models/UserSubscription.js
import mongoose from "mongoose";

const userSubscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    subscription: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription", required: true },

    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },

    status: {
      type: String,
      enum: ["active", "inactive", "pending"],
      default: "pending",
    },

    activatedAt: { type: Date, default: null },

    // If your plans are lifetime, you can leave expiresAt null
    expiresAt: { type: Date, default: null },

    // Optional but useful for fast lookups without population
    planCode: { type: String, enum: ["A", "B"] },
  },
  { timestamps: true }
);

// Auto-set planCode from subscription document
userSubscriptionSchema.pre("save", async function (next) {
  if (!this.planCode && this.subscription) {
    const sub = await mongoose.model("Subscription").findById(this.subscription).select("code");
    if (sub) this.planCode = sub.code;
  }
  next();
});

export default mongoose.model("UserSubscription", userSubscriptionSchema);
