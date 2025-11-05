import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
   
    discountRate: { type: Number, default: 10 }, 

    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Vendor", vendorSchema);
