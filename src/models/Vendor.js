import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    shopName: { type: String},
    shopCategory: { type: String },
    shopAddress: { type: String },
    websiteUrl: String,
    gstNumber: String,
    businessLogo: String,
    kycDocuments: {
      pan: String,
      gst: String,
      license: String,
    },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Vendor", vendorSchema);
