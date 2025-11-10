import mongoose from "mongoose";
import BankAccount from "../models/BankAccount.js";
import Wallet from "../models/Wallet.js";
import WalletTransaction from "../models/WalletTransaction.js";
import apiResponse from "../utils/apiResponse.js";




export const getWalletDetails = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user.id });
    const transactions = await WalletTransaction.find({ user: req.user.id }).sort({ createdAt: -1 });

    return res.json(apiResponse({
      success: true,
      message: "Wallet details fetched",
      data: {
        balance: wallet?.balance || 0,
        transactions,
      }
    }));
  } catch (error) {
    return res.status(500).json(apiResponse({ success: false, message: error.message }));
  }
};


export const addBankAccount = async (req, res) => {
  try {
    const { accountHolderName, accountNumber, ifscCode, bankName, branchName, upiId, isPrimary } = req.body;

    // If user sets this account as primary → remove primary from others
    if (isPrimary) {
      await BankAccount.updateMany({ user: req.user.id }, { isPrimary: false });
    }

    const bank = await BankAccount.create({
      user: req.user.id,
      accountHolderName,
      accountNumber,
      ifscCode,
      bankName,
      branchName,
      upiId,
      isPrimary: isPrimary ?? true
    });

    res.json(apiResponse({ success: true, message: "Bank account added", data: bank }));

  } catch (error) {
    res.status(500).json(apiResponse({ success: false, message: error.message }));
  }
};

// ✅ Update Bank Account
export const updateBankAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { accountHolderName, accountNumber, ifscCode, bankName, branchName, upiId, isPrimary } = req.body;

    // If making this primary → remove primary from others
    if (isPrimary) {
      await BankAccount.updateMany({ user: req.user.id }, { isPrimary: false });
    }

    const updatedBank = await BankAccount.findOneAndUpdate(
      { _id: id, user: req.user.id },
      { accountHolderName, accountNumber, ifscCode, bankName, branchName, upiId, isPrimary },
      { new: true }
    );

    if (!updatedBank) {
      return res.status(404).json(apiResponse({ success: false, message: "Bank account not found" }));
    }

    res.json(apiResponse({ success: true, message: "Bank account updated", data: updatedBank }));

  } catch (error) {
    res.status(500).json(apiResponse({ success: false, message: error.message }));
  }
};

export const Bank = async (req, res) => {
  try {
    const banks = await BankAccount.find({ user: req.user._id }).sort({ createdAt: -1 });

    res.json(apiResponse({
      success: true,
      data: banks
    }));
  } catch (err) {
    res.status(500).json(apiResponse({ success: false, message: err.message }));
  }
};



export const getWalletAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get Wallet Balance
    const wallet = await Wallet.findOne({ user: userId });

    // Calculate Total Credit
    const credit = await WalletTransaction.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId), type: "CREDIT" } },
      { $group: { _id: null, totalCredit: { $sum: "$amount" } } }
    ]);

    // Calculate Total Debit
    const debit = await WalletTransaction.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId), type: "DEBIT" } },
      { $group: { _id: null, totalDebit: { $sum: "$amount" } } }
    ]);

    // Breakdown by Action (Category Wise Analytics)
    const analytics = await WalletTransaction.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$action",
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      }
    ]);

    const labelMap = {
      activation_cashback: "Activation Bonus",
      shopping_cashback: "Shopping Cashback",
      first_shopping_cashback: "First Shopping Bonus",
      referral_bonus: "Referral Bonus",
      pair_bonus: "Pair Bonus",
      withdrawal: "Withdrawal"
    };

    const formattedAnalytics = analytics.map(a => ({
      action: a._id,
      label: labelMap[a._id] || a._id,
      total: Math.abs(a.total),
      count: a.count,
      type: a.total > 0 ? "income" : "expense"
    }));

    return res.json(apiResponse({
      success: true,
      message: "Wallet analytics fetched",
      data: {
        balance: wallet?.balance || 0,
        totalCredited: credit[0]?.totalCredit || 0,
        totalDebited: debit[0]?.totalDebit || 0,
        analytics: formattedAnalytics
      }
    }));

  } catch (err) {
    return res.status(500).json(apiResponse({ success: false, message: err.message }));
  }
};

