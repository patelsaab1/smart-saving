
import User from "../models/User.js";
import { createActivity } from "./userActivityService.js";
import cloudinary from "./cloudinary.js";

// Upload new bill
export const uploadBill = async (userId, billType, amount, file) => {
  if (!file) throw new Error("Bill image is required");

  const bill = new UserBill({
    user: userId,
    billType,
    amount,
    billImage: file.path,           // Cloudinary auto-injected path
    imagePublicId: file.filename,   // Unique public_id from storage
  });

  await bill.save();

  // Log activity
  await createActivity(userId, "bill_upload", 0, 0, { billId: bill._id });

  return bill;
};

// User Bills
export const getUserBills = async (userId) => {
  return await UserBill.find({ user: userId }).sort({ createdAt: -1 });
};

// Admin: All Bills
export const getAllBills = async () => {
  return await UserBill.find()
    .populate("user", "name email phone role")
    .sort({ createdAt: -1 });
};

// Approve Bill
export const approveBill = async (billId, adminId, rewardCoins = 50, rewardCash = 0) => {
  const bill = await UserBill.findById(billId).populate("user");
  if (!bill) throw new Error("Bill not found");

  bill.status = "approved";
  bill.rewardCoins = rewardCoins;
  bill.rewardCash = rewardCash;
  bill.approvedBy = adminId;
  bill.approvedAt = new Date();
  await bill.save();

  // Update user
  const user = await User.findById(bill.user._id);
  if (user) {
    user.wallets.cash += rewardCash;
    user.coins += rewardCoins;
    await user.save();
  }

  // Log activity
  await createActivity(user._id, "bill_upload", 0, rewardCoins, { billId: bill._id, approved: true });

  return bill;
};

// Reject Bill + delete from Cloudinary
export const rejectBill = async (billId, adminId) => {
  const bill = await UserBill.findById(billId);
  if (!bill) throw new Error("Bill not found");

  if (bill.imagePublicId) {
    await cloudinary.uploader.destroy(bill.imagePublicId).catch(() => {});
  }

  bill.status = "rejected";
  bill.approvedBy = adminId;
  bill.approvedAt = new Date();
  await bill.save();

  return bill;
};
