// src/controllers/withdrawalController.js (New)
import Withdrawal from "../models/Withdrawal.js";
import { updateWallet } from "../services/walletService.js";
import apiResponse from "../utils/apiResponse.js";

export const requestWithdrawal = async (req, res) => {
  try {
    const { amount, bankDetails } = req.body;
    const user = req.user;

    if (amount > user.wallets.withdrawable) return res.status(400).json(apiResponse({ success: false, message: "Insufficient balance" }));

    const withdrawal = new Withdrawal({
      user: user._id,
      amount,
      bankDetails,
    });
    await withdrawal.save();

    // Debit wallet immediately, process later
    await updateWallet({
      userId: user._id,
      amount: -amount,
      action: "withdrawal",
      referenceId: withdrawal._id.toString(),
      description: "Withdrawal request",
    });

    // Admin will process in 24-48 hrs (add admin route to update status)

    return res.json(apiResponse({ message: "Withdrawal requested", data: withdrawal }));
  } catch (err) {
    return res.status(500).json(apiResponse({ success: false, message: "Server error" }));
  }
};