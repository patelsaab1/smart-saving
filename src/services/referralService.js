// src/services/referralService.js (NO TRANSACTIONS)
import User from "../models/User.js";
import Referral from "../models/Referral.js";
import { updateWallet } from "./walletService.js";

const pairRewards = [
  { pair: 1, referralAmount: 1500, incrementBonus: 1000, total: 2500 },
  { pair: 2, referralAmount: 3000, incrementBonus: 2000, total: 5000 },
  { pair: 3, referralAmount: 3000, incrementBonus: 3000, total: 6000 },
  { pair: 4, referralAmount: 3000, incrementBonus: 4000, total: 7000 },
  { pair: 5, referralAmount: 3000, incrementBonus: 5000, total: 8000 },
  { pair: 6, referralAmount: 3000, incrementBonus: 6000, total: 9000 },
  { pair: 7, referralAmount: 3000, incrementBonus: 7000, total: 9000 },
  { pair: 20, referralAmount: 3000, incrementBonus: 20000, total: 23000, extra: "Domestic Trip + Awards" },
];

export const handleReferralBonus = async (newUserId) => {
  try {
    const newUser = await User.findById(newUserId);
    if (!newUser || !newUser.referredBy) return;

    const referrer = await User.findOne({ referralCode: newUser.referredBy });
    if (!referrer || referrer.planType !== "A") return;

    // ✅ Create referral record (no array, no session)
    await Referral.create({
      referrer: referrer._id,
      referredUser: newUser._id,
      bonusAwarded: true,
      activatedAt: new Date(),
    });

    // ✅ Direct referral bonus
    let bonusAmount = (newUser.planType === "A") ? 500 :
      (newUser.planType === "B") ? 200 : 0;

    if (bonusAmount > 0) {
      await updateWallet({
        userId: referrer._id,
        amount: bonusAmount,
        action: "referral_bonus",
        referenceId: newUser._id,
        description: `Direct referral bonus for Plan ${newUser.planType}`,
        referenceModel: "Referral",
      });
    }

    // ✅ Increase referral count (Plan A & B only)
    if (["A", "B"].includes(newUser.planType)) {
      referrer.referralCount += 1;
    }

    // ✅ Count Plan A referrals correctly
    const planAReferrals = await Referral.countDocuments({
      referrer: referrer._id
    }).populate("referredUser");

    console.log("planrefer count ", planAReferrals)
    // Pair Logic
    let pairs = 0;
    if (planAReferrals >= 3) {
      pairs = 1 + Math.floor((planAReferrals - 3) / 6);
    }
console.log("pair count ",pairCount)
    // If new pairs unlocked, award rewards
    if (pairs > referrer.pairCount) {
      const unlocked = pairs - referrer.pairCount;

      for (let i = 1; i <= unlocked; i++) {
        const currentPairNo = referrer.pairCount + i;
        const reward = pairRewards.find(r => r.pair === currentPairNo) || { incrementBonus: 1000 };

        await updateWallet({
          userId: referrer._id,
          amount: reward.incrementBonus,
          action: "pair_bonus",
          referenceId: newUser._id,
          description: `Pair ${currentPairNo} bonus awarded`,
          referenceModel: "Referral",
        });

        if (currentPairNo === 20) {
          referrer.rewards.push({ type: "domestic_trip", awardedAt: new Date() });
        }
      }

      referrer.pairCount = pairs;
    }

    await referrer.save();

  } catch (err) {
    console.error("❌ Referral bonus failed:", err);
    throw err;
  }
};
