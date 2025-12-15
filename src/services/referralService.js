

import User from "../models/User.js";
import Referral from "../models/Referral.js";
import { updateWallet } from "./walletService.js";

const pairRewards = [
  { pair: 1, incrementBonus: 1000 },
  { pair: 2, incrementBonus: 2000 },
  { pair: 3, incrementBonus: 3000 },
  { pair: 4, incrementBonus: 4000 },
  { pair: 5, incrementBonus: 5000 },
  { pair: 6, incrementBonus: 6000 },
  { pair: 20, incrementBonus: 20000, extra: "Domestic Trip + Awards" }
];

// --------------------------------------------------------
// MAIN REFERRAL BONUS FUNCTION
// --------------------------------------------------------
export const handleReferralBonus = async (newUserId) => {
  try {
    const newUser = await User.findById(newUserId);
    if (!newUser || !newUser.referredBy) return;

    const referrer = await User.findOne({ referralCode: newUser.referredBy });
    if (!referrer || referrer.planType !== "A") return;

    // CREATE REFERRAL ENTRY
    await Referral.create({
      referrer: referrer._id,
      referredUser: newUser._id,
      bonusAwarded: true,
      activatedAt: new Date(),
    });

    // DIRECT REFERRAL BONUS
    const directBonus = newUser.planType === "A" ? 500
      : newUser.planType === "B" ? 200
      : 0;

    if (directBonus > 0) {
      await updateWallet({
        userId: referrer._id,
        amount: directBonus,
        action: "referral_bonus",
        referenceId: newUser._id,
        referenceModel: "Referral",
        description: `Direct referral bonus for Plan ${newUser.planType}`,
      });
    }

    // UPDATE REFERRAL COUNT
    referrer.referralCount += 1;
    await referrer.save();

    // --------------------------------------------------------
    // PAIR CALCULATION LOGIC
    // Count ONLY referrals where referredUser.planType === A
    // --------------------------------------------------------
    const planARefs = await Referral.find({ referrer: referrer._id })
      .populate("referredUser", "planType");

    const planARefCount = planARefs.filter(r => r.referredUser?.planType === "A").length;

    // console.log("Plan A referral count:", planARefCount);

    // PAIR FORMULA
    let totalPairs = 0;
    if (planARefCount >= 3) {
      totalPairs = 1 + Math.floor((planARefCount - 3) / 6);
    }

    // console.log("Calculated pairs:", totalPairs);
    // console.log("Existing pairs:", referrer.pairCount);

    // --------------------------------------------------------
    // AWARD NEWLY UNLOCKED PAIRS
    // --------------------------------------------------------
    if (totalPairs > referrer.pairCount) {
      const newlyUnlocked = totalPairs - referrer.pairCount;

      for (let i = 1; i <= newlyUnlocked; i++) {
        const currentPair = referrer.pairCount + i;
        const reward = pairRewards.find(p => p.pair === currentPair);

        const bonusAmount = reward?.incrementBonus || 1000;

        await updateWallet({
          userId: referrer._id,
          amount: bonusAmount,
          action: "pair_bonus",
          referenceId: newUser._id,
          referenceModel: "Referral",
          description: `Pair ${currentPair} Bonus`,
        });

        if (reward?.extra === "Domestic Trip + Awards") {
          referrer.rewards.push({
            type: "domestic_trip",
            awardedAt: new Date(),
          });
        }
      }

      // UPDATE PAIR COUNT
      referrer.pairCount = totalPairs;
      await referrer.save();
    }

    return true;

  } catch (err) {
    console.error("❌ Referral bonus failed:", err);
    throw err;
  }
};
