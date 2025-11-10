import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    shopName: { type: String, required: true },
    shopCategory: { type: String, required: true },
    shopAddress: { type: String, required: true },

    gstNumber: { type: String },
     kycDocuments: {
      pan: String,
      gst: String,
      license: String,
    },
    businessLogo: { type: String },

    isVerified: { type: Boolean, default: false }, // ✅ Admin verification
  },
  { timestamps: true }
);

export default mongoose.model("Vendor", vendorSchema);
