import mongoose from "mongoose";
import User from "../models/User.js";
import Referral from "../models/Referral.js";
import { updateWallet } from "./walletService.js";

const pairRewards = [
  { pair: 1, referralAmount: 1500, incrementBonus: 1000, total: 2500 },
  { pair: 2, referralAmount: 3000, incrementBonus: 2000, total: 5000 },
  { pair: 3, referralAmount: 3000, incrementBonus: 3000, total: 6000 },
  { pair: 4, referralAmount: 3000, incrementBonus: 4000, total: 7000 },
  { pair: 5, referralAmount: 3000, incrementBonus: 5000, total: 8000 },
  // ... Extend up to 19th pair
  { pair: 19, referralAmount: 3000, incrementBonus: 19000, total: 22000 },
  { pair: 20, referralAmount: 3000, incrementBonus: 20000, total: 23000 },
];

export const handleReferralBonus = async (newUserId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const newUser = await User.findById(newUserId).session(session);
    if (!newUser || !newUser.referredBy) {
      await session.commitTransaction();
      return;
    }

    const referrer = await User.findOne({ referralCode: newUser.referredBy }).session(session);
    if (!referrer || referrer.planType !== "A") {
      await session.commitTransaction();
      return;
    }

    // Create referral record
    await Referral.create(
      [{
        referrer: referrer._id,
        referredUser: newUser._id,
        bonusAwarded: true,
        activatedAt: new Date(),
      }],
      { session }
    );

    // Direct referral bonus ₹500
    await updateWallet({
      userId: referrer._id,
      amount: 500,
      action: "referral_bonus",
      referenceId: newUser._id,
      description: "Direct referral bonus",
      referenceModel: "Referral",
    }, { session });

    // Update referral count
    referrer.referralCount += 1;

    // Calculate pairs
    const referrals = referrer.referralCount;
    let pairs = 0;
    if (referrals >= 3) pairs = 1 + Math.floor((referrals - 3) / 6);

    if (pairs > referrer.pairCount) {
      const newPairs = pairs - referrer.pairCount;

      for (let i = 1; i <= newPairs; i++) {
        const currentPairNo = referrer.pairCount + i;
        const reward = pairRewards.find(r => r.pair === currentPairNo) || { total: 3000 };

        await updateWallet({
          userId: referrer._id,
          amount: reward.total,
          action: "pair_bonus",
          referenceId: newUser._id,
          description: `Pair ${currentPairNo} bonus for referrals`,
          referenceModel: "Referral",
        }, { session });

        if (currentPairNo === 20) {
          referrer.rewards = referrer.rewards || [];
          referrer.rewards.push({ type: "domestic_trip", awardedAt: new Date() });
        }
      }
      referrer.pairCount = pairs;
    }

    await referrer.save({ session });
    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw new Error(`Referral bonus failed: ${err.message}`);
  } finally {
    session.endSession();
  }
};
