import mongoose from "mongoose";
import ShoppingBill from "../models/ShoppingBill.js";
import User from "../models/User.js";
import Shop from "../models/Shop.js";
import WalletTransaction from "../models/WalletTransaction.js";

import apiResponse  from "../utils/apiResponse.js";
import cloudinary from "cloudinary";
import { uploadSingle } from "../middlewares/multerMemory.js";
import AuditLog from "../models/AuditLog.js";


// User Upload Bill 
export const uploadBill = [uploadSingle("billImage"), async (req, res) => {
  try {
    const { shopId, billAmount } = req.body;

    // if (!validator.isFloat(billAmount.toString(), { min: 0.01 })) {
    //   return res.status(400).json(apiResponse({ success: false, message: "Invalid bill amount" }));
    // }
    if (!mongoose.isValidObjectId(shopId)) {
      return res.status(400).json(apiResponse({ success: false, message: "Invalid shop ID" }));
    }

    const shop = await Shop.findById(shopId);
    if (!shop || shop.status !== "active") {
      return res.status(400).json(apiResponse({ success: false, message: "Invalid or inactive shop" }));
    }

    const result = await cloudinary.uploader.upload(req.file.buffer.toString("base64"), { resource_type: "auto" });

    const bill = new ShoppingBill({
      user: req.user._id,
      shop: shopId,
      billAmount: parseFloat(billAmount),
      billImage: result.secure_url,
      status: "pending",
    });
    await bill.save();

    return res.json(apiResponse({ message: "Bill uploaded, pending admin approval", data: bill }));
  } catch (err) {
    console.error("❌ Upload Bill Error:", err);
    return res.status(500).json(apiResponse({ success: false, message: "Server error" }));
  }
}];

// Admin Approve Bill
export const approveBill = async (req, res) => {
  try {
    const { billId } = req.params;
    const { cashbackAmount } = req.body;

    const bill = await ShoppingBill.findById(billId).populate("user");
    if (!bill || bill.status !== "pending") {
      return res.status(400).json(apiResponse({ success: false, message: `Bill already ${bill.status}` }));
    }

    // if (!validator.isFloat(cashbackAmount.toString(), { min: 0, max: bill.billAmount * 0.4 })) {
    //   return res.status(400).json(apiResponse({ success: false, message: "Cashback must be 1-40% of bill" }));
    // }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      bill.cashbackAmount = cashbackAmount;
      bill.status = "approved";
      bill.approvedAt = new Date();
      await bill.save({ session });

      await WalletTransaction.create(
        [{
          user: bill.user._id,
          amount: cashbackAmount,
          action: "shopping_cashback",
          referenceId: bill._id,
          referenceModel: "ShoppingBill",
          description: `Cashback on bill of ₹${bill.billAmount}`,
        }],
        { session }
      );

      if (!bill.user.firstShoppingCashbackClaimed && !bill.firstCashbackProcessed) {
        const firstCashback = bill.user.planType === "A" ? 500 : 250;
        await WalletTransaction.create(
          [{
            user: bill.user._id,
            amount: firstCashback,
            action: "first_shopping_cashback",
            referenceId: bill._id,
            referenceModel: "ShoppingBill",
            description: "First shopping cashback",
          }],
          { session }
        );
        bill.user.firstShoppingCashbackClaimed = true;
        bill.firstCashbackProcessed = true;
        await bill.user.save({ session });
      }

      if (bill.user.referredBy && !bill.referrerBonusProcessed) {
        const referrer = await User.findOne({ referralCode: bill.user.referredBy }).session(session);
        if (referrer && referrer.planType === "A") {
          const referralBonus = bill.billAmount * 0.02;
          await WalletTransaction.create(
            [{
              user: referrer._id,
              amount: referralBonus,
              action: "referral_bonus",
              referenceId: bill._id,
              referenceModel: "ShoppingBill",
              description: `2% bonus from referred user's bill`,
            }],
            { session }
          );
          bill.referrerBonusProcessed = true;
        }
      }

      await bill.save({ session });
      await AuditLog.create(
        [{
          adminId: req.user._id,
          action: "approve_bill",
          details: { billId, cashbackAmount },
          timestamp: new Date(),
        }],
        { session }
      );

      await session.commitTransaction();
      return res.json(apiResponse({ message: "Bill approved and rewards processed", data: bill }));
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  } catch (err) {
    console.error("❌ Approve Bill Error:", err);
    return res.status(500).json(apiResponse({ success: false, message: "Server error" }));
  }
};

// Admin Reject Bill
export const rejectBill = async (req, res) => {
  try {
    const { billId } = req.params;

    const bill = await ShoppingBill.findById(billId);
    if (!bill || bill.status !== "pending") {
      return res.status(400).json(apiResponse({ success: false, message: `Bill already ${bill.status}` }));
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      bill.status = "rejected";
      await bill.save({ session });

      await AuditLog.create(
        [{
          adminId: req.user._id,
          action: "reject_bill",
          details: { billId },
          timestamp: new Date(),
        }],
        { session }
      );

      await session.commitTransaction();
      return res.json(apiResponse({ message: "Bill rejected", data: bill }));
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  } catch (err) {
    console.error("❌ Reject Bill Error:", err);
    return res.status(500).json(apiResponse({ success: false, message: "Server error" }));
  }
};