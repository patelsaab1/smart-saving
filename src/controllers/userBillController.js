import * as billService from "../services/userBillService.js";
import apiResponse from "../utils/apiResponse.js";

// Upload
export const uploadBill = async (req, res) => {
  try {
    const { billType, amount } = req.body;
    const bill = await billService.uploadBill(req.user.id, billType, amount, req.file);
    return res.json(apiResponse({ success: true, message: "Bill uploaded", data: bill }));
  } catch (err) {
    return res.status(500).json(apiResponse({ success: false, message: err.message }));
  }
};

// My Bills
export const myBills = async (req, res) => {
  try {
    const bills = await billService.getUserBills(req.user.id);
    return res.json(apiResponse({ success: true, data: bills }));
  } catch (err) {
    return res.status(500).json(apiResponse({ success: false, message: err.message }));
  }
};

// All Bills (Admin)
export const allBills = async (req, res) => {
  try {
    const bills = await billService.getAllBills();
    return res.json(apiResponse({ success: true, data: bills }));
  } catch (err) {
    return res.status(500).json(apiResponse({ success: false, message: err.message }));
  }
};

// Approve Bill (Admin)
export const approveBill = async (req, res) => {
  try {
    const { billId } = req.params;
    const { rewardCoins, rewardCash } = req.body;

    const bill = await billService.approveBill(billId, req.user.id, rewardCoins, rewardCash);
    return res.json(apiResponse({ success: true, message: "Bill approved", data: bill }));
  } catch (err) {
    return res.status(500).json(apiResponse({ success: false, message: err.message }));
  }
};

// Reject Bill (Admin)
export const rejectBill = async (req, res) => {
  try {
    const { billId } = req.params;
    const bill = await billService.rejectBill(billId, req.user.id);
    return res.json(apiResponse({ success: true, message: "Bill rejected", data: bill }));
  } catch (err) {
    return res.status(500).json(apiResponse({ success: false, message: err.message }));
  }
};
