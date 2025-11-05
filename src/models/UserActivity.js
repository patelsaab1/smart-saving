import mongoose from "mongoose";

const userActivitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    type: {
      type: String,
      enum: ["login", "referral_join", "spin_game", "quiz", "purchase", "bill_upload"],
      required: true,
    },

    pointsEarned: { type: Number, default: 0 }, // gamification
    coinsEarned: { type: Number, default: 0 },  // app coins/credits

    metadata: { type: Object }, // extra info (quizId, gameId, purchaseId, etc.)

    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("UserActivity", userActivitySchema);

// 👉 Track करेगा हर यूज़र का daily actions, जैसे login, spin game, quiz, referral join, etc.


// हर बार जब user कोई action करता है (login, referral join, spin game, quiz complete, purchase, bill upload) → एक UserActivity document create होता है।

// इससे आप आसानी से यूज़र का engagement track कर सकते हो (gamification + analytics)।

// Example:

// Login = 5 points

// Quiz Pass = 50 coins

// Spin Game Win = 20 coins

// 👉 Track करेगा हर यूज़र का daily actions, जैसे login, spin game, quiz, referral join, etc.


// हर बार जब user कोई action करता है (login, referral join, spin game, quiz complete, purchase, bill upload) → एक UserActivity document create होता है।

// इससे आप आसानी से यूज़र का engagement track कर सकते हो (gamification + analytics)।

// Example:

// Login = 5 points

// Quiz Pass = 50 coins

// Spin Game Win = 20 coins