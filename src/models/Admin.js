// models/Admin.js
import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    username: { type: String, unique: true }, // ✅ NEW
    email: { type: String, unique: true, required: true },
    phone: { type: String, unique: true },
    password: { type: String, required: true, select: false },

    role: {
      type: String,
      enum: ["admin", "superadmin"],
      default: "admin",
    },

    wallet: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Admin", adminSchema);
