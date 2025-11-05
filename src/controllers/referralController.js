import User from "../models/User.js";
import Referral from "../models/Referral.js";
import apiResponse from "../utils/apiResponse.js";

export const getReferrals = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("referralCode referralCount pairCount planType");
    if (!user || user.planType !== "A") {
      return res.status(403).json(apiResponse({ success: false, message: "Only Plan A users can access referrals" }));
    }

    const referrals = await Referral.find({ referrer: user._id })
      .populate("referredUser", "name email phone isActive createdAt")
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
