// src/controllers/
// .js (Updated for redeem points)
import UserActivity from "../models/UserActivity.js";
import { updateWallet } from "../services/walletService.js";
import apiResponse from "../utils/apiResponse.js";

export const addActivity = async (req, res) => {
  try {
    const { type, pointsEarned, metadata } = req.body;
    const activity = new UserActivity({
      user: req.user._id,
      type,
      pointsEarned,
      metadata,
    });
    await activity.save();

    req.user.redeemPoints += pointsEarned;
    await req.user.save();

    return res.json(apiResponse({ message: "Activity added", data: activity }));
  } catch (err) {
    return res.status(500).json(apiResponse({ success: false, message: "Server error" }));
  }
};

export const redeemPoints = async (req, res) => {
  try {
    const { points } = req.body;
    if (points % 1000 !== 0) return res.status(400).json(apiResponse({ success: false, message: "Points must be multiple of 1000" }));
    if (points > req.user.redeemPoints) return res.status(400).json(apiResponse({ success: false, message: "Insufficient points" }));

    const cash = points / 1000; // 1000 points = ₹1? Doc says 1000 Points = Withdrawable Wallet (assuming ₹1, adjust if needed)

    await updateWallet({
      userId: req.user._id,
      amount: cash,
      action: "points_redeem",
      description: "Redeemed points to cash",
    });

    req.user.redeemPoints -= points;
    await req.user.save();

    return res.json(apiResponse({ message: "Points redeemed" }));
  } catch (err) {
    return res.status(500).json(apiResponse({ success: false, message: "Server error" }));
  }
};

// Add monthly rewards logic (cron job for 3 pairs/month gift, lucky draw, leaderboard)