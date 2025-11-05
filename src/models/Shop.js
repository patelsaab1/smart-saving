import mongoose from "mongoose";

const shopSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  shopName: { type: String, required: true, trim: true },
  category: { type: String, required: true },
  subcategory: String,
  address: { street: String, city: String, state: String, country: String, zip: String },
  contactNumber: { type: String, required: true },
  documents: { gstNumber: String, licenseDoc: String, rentAgreement: String },
  defaultDiscountRate: { type: Number, min: 1, max: 40, default: 10 },
  rateListFile: String,
  rateListStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  status: { type: String, enum: ["pending", "active", "inactive", "blocked"], default: "pending" },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

export default mongoose.model("Shop", shopSchema);
