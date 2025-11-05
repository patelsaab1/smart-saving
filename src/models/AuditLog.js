import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true }, // approve_bill, reject_bill, etc.
    details: { type: Object }, // flexible JSON field (billId, cashbackAmount, etc.)
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Indexes for performance
auditLogSchema.index({ adminId: 1, action: 1, createdAt: -1 });

export default mongoose.model("AuditLog", auditLogSchema);
