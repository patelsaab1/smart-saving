import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    phone: { type: String, unique: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["admin", "superadmin"], default: "admin" },

    permissions: {
      manageUsers: { type: Boolean, default: true },
      manageVendors: { type: Boolean, default: true },
      manageWallets: { type: Boolean, default: true },
      manageReferrals: { type: Boolean, default: true },
      manageInsurance: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Admin", adminSchema);
