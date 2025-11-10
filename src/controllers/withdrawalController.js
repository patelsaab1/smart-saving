// src/controllers/withdrawalController.js (New)
import Withdrawal from "../models/Withdrawal.js";
import { updateWallet } from "../services/walletService.js";
import apiResponse from "../utils/apiResponse.js";
import {  sendSmartSavingMailpayment, smartSavingEmailTemplate } from "../services/emailService.js";
import User from "../models/User.js";
import BankAccount from "../models/BankAccount.js";


export const getMyWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ user: req.user.id })
      .populate("bankAccount")
      .sort({ requestedAt: -1 });

  
    return res.json(apiResponse({ success: true, message: "Successfull", data: withdrawals }));

  } catch (error) {
    console.log(error);
    
    res.status(500).json({ success: false, message: "Server Error" });
  }
};




export const requestWithdrawal = async (req, res) => {
  try {
    const { amount, bankAccountId, upiId } = req.body;
    const userId = req.user.id;

    if (!amount || amount < 100) {
      return res.status(400).json(apiResponse({ success: false, message: "Minimum withdrawal ₹100" }));
    }

    // Validate UPI if provided
    if (!bankAccountId && upiId) {
      const isValidUPI = /^[a-zA-Z0-9.\-_]{3,}@[a-zA-Z]{3,}$/.test(upiId);
      if (!isValidUPI) {
        return res.status(400).json(apiResponse({ success: false, message: "Invalid UPI ID" }));
      }
    }

    // Validate bank account if provided
    let bank = null;
    if (bankAccountId) {
      bank = await BankAccount.findOne({ _id: bankAccountId, user: userId });
      if (!bank) {
        return res.status(400).json(apiResponse({ success: false, message: "Invalid bank account" }));
      }
    }

    // ✅ Create withdrawal request (NO WALLET DEDUCTION HERE)
    const withdrawal = await Withdrawal.create({
      user: userId,
      bankAccount: bankAccountId ?? null,
      upiId: bankAccountId ? null : upiId,
      amount,
      status: "PENDING"
    });


// After withdrawal creation:
const user = await User.findById(userId);

await sendSmartSavingMailpayment(
  user.email,
  "Withdrawal Request Received 🕒",
  smartSavingEmailTemplate(
    "निकासी अनुरोध प्राप्त हुआ ✅",
    `
      नमस्कार <b>${user.name}</b> जी,<br/><br/>
      आपका निकासी अनुरोध ₹<b>${amount}</b> प्राप्त हो गया है।<br/><br/>
      हमारी टीम जल्द ही इसकी पुष्टि करेगी।
    `
  )
);

    return res.json(apiResponse({ success: true, message: "Withdrawal request submitted", data: withdrawal }));

  } catch (err) {
    return res.status(500).json(apiResponse({ success: false, message: err.message }));
  }
};



export const getPendingRequests = async (req, res) => {
  try {
    const requests = await Withdrawal.find({ status: "PENDING" })
      .populate("user bankAccount")
      .sort({ requestedAt: -1 });

    res.json({ success: true, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const approveWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    const withdrawal = await Withdrawal.findById(id);

    if (!withdrawal || withdrawal.status !== "PENDING") {
      return res.status(400).json(apiResponse({ success: false, message: "Invalid withdrawal request" }));
    }

    // ✅ Deduct wallet balance + Create Transaction
    await updateWallet({
      userId: withdrawal.user,
      amount: -withdrawal.amount,
      action: "withdrawal",
      referenceId: withdrawal._id,
      description: withdrawal.bankAccount ? "Withdrawal to Bank" : "Withdrawal to UPI"
    });

    withdrawal.status = "APPROVED";
    withdrawal.processedAt = new Date();
    await withdrawal.save();

    const user = await User.findById(withdrawal.user);

    await sendSmartSavingMailpayment(
      user.email,
      "Withdrawal Approved & Sent 🎉",
      smartSavingEmailTemplate(
        "आपकी निकासी राशि भेज दी गई ✅",
        `
      नमस्कार <b>${user.name}</b> जी,<br/><br/>
      आपकी निकासी राशि <b>₹${withdrawal.amount}</b> सफलतापूर्वक आपके खाते में भेज दी गई है।<br/><br/>

      भुगतान विधि: <b>${withdrawal.bankAccount ? "Bank Transfer" : "UPI"}</b><br/>
      ट्रांजैक्शन ID: <b>${withdrawal._id}</b><br/><br/>

      राशि आपके खाते में 5-15 मिनट में परिलक्षित हो जाएगी। 🌱
    `
      )
    );

    return res.json(apiResponse({ success: true, message: "Withdrawal approved successfully" }));

  } catch (err) {
    return res.status(500).json(apiResponse({ success: false, message: err.message }));
  }
};


export const rejectWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    const withdrawal = await Withdrawal.findById(id);

    if (!withdrawal || withdrawal.status !== "PENDING") {
      return res.status(400).json(apiResponse({ success: false, message: "Invalid withdrawal request" }));
    }

    withdrawal.status = "REJECTED";
    withdrawal.processedAt = new Date();
    await withdrawal.save();

const user = await User.findById(withdrawal.user);

await sendSmartSavingMailpayment(
  user.email,
  "Withdrawal Request Rejected ⚠️",
  smartSavingEmailTemplate(
    "निकासी अनुरोध अस्वीकृत ❌",
    `
      नमस्कार <b>${user.name}</b> जी,<br/><br/>
      आपका निकासी अनुरोध इस समय स्वीकृत नहीं किया जा सका है।<br/><br/>
      कृपया खाते की जानकारी की जांच करें और पुनः प्रयास करें। 🙏
    `
  )
);


    return res.json(apiResponse({ success: true, message: "Withdrawal rejected" }));

  } catch (err) {
    return res.status(500).json(apiResponse({ success: false, message: err.message }));
  }
};
