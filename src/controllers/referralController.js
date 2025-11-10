// src/controllers/referralController.js (Updated with Analytics)
import User from "../models/User.js";
import Referral from "../models/Referral.js";
import WalletTransaction from "../models/WalletTransaction.js";
import apiResponse from "../utils/apiResponse.js";

export const getReferrals = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("referralCode referralCount pairCount planType");
    if (!user || user.planType !== "A") {
      return res.status(403).json(apiResponse({ success: false, message: "Only Plan A users can access referrals" }));
    }

    const referrals = await Referral.find({ referrer: user._id })
      .populate("referredUser", "name email phone isActive createdAt planType")
      .sort({ createdAt: -1 });

    return res.json(apiResponse({
      data: {
        referralCode: user.referralCode,
        referralCount: user.referralCount,
        pairCount: user.pairCount,
        referrals,
      }
    }));
  } catch (err) {
    console.error("❌ Get Referrals Error:", err);
    return res.status(500).json(apiResponse({ success: false, message: "Server error" }));
  }
};

export const getReferralAnalytics = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || user.planType !== "A") {
      return res.status(403).json(apiResponse({ success: false, message: "Only Plan A users can access referral analytics" }));
    }

    // Total earnings from referrals
    const referralEarnings = await WalletTransaction.aggregate([
      { $match: { user: user._id, action: { $in: ["referral_bonus", "pair_bonus"] } } },
      { $group: { _id: "$action", total: { $sum: "$amount" }, count: { $sum: 1 } } }
    ]);

    // Active vs Inactive referrals
    const activeReferrals = await Referral.countDocuments({ referrer: user._id, activatedAt: { $exists: true } });
    const inactiveReferrals = user.referralCount - activeReferrals;

    // Monthly referral growth (last 3 months example)
    const monthlyReferrals = await Referral.aggregate([
      { $match: { referrer: user._id, createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    return res.json(apiResponse({
      data: {
        totalEarnings: referralEarnings.reduce((acc, e) => acc + e.total, 0),
        referralEarningsBreakdown: referralEarnings,
        activeReferrals,
        inactiveReferrals,
        monthlyGrowth: monthlyReferrals,
        nextPairThreshold: calculateNextPairThreshold(user.referralCount),
      }
    }));
  } catch (err) {
    console.error("❌ Referral Analytics Error:", err);
    return res.status(500).json(apiResponse({ success: false, message: "Server error" }));
  }
};

const calculateNextPairThreshold = (currentReferrals) => {
  if (currentReferrals < 3) return { referralsNeeded: 3 - currentReferrals, forPair: 1 };
  const extra = (currentReferrals - 3) % 6;
  return { referralsNeeded: 6 - extra, forPair: Math.floor((currentReferrals - 3) / 6) + 2 };
};