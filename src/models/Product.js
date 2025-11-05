import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true },
  discountPercent: { type: Number, min: 0, max: 100, required: true },
  finalPrice: Number,
  status: { type: String, enum: ["pending", "approved", "rejected", "inactive"], default: "pending" },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  approvedAt: Date,
  lastUpdatedByVendor: Date,
}, { timestamps: true });

productSchema.pre("save", function(next) {
  if (this.price && this.discountPercent != null) {
    this.finalPrice = this.price - (this.price * this.discountPercent) / 100;
  }
  next();
});

export default mongoose.model("Product", productSchema);
