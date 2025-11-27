import User from "../models/User.js";
import Payment from "../models/Payment.js";
import Razorpay from "razorpay";
import apiResponse from "../utils/apiResponse.js";
import { updateWallet } from "../services/walletService.js";
import { handleReferralBonus } from "../services/referralService.js";
import dotenv from "dotenv";
import Subscription from "../models/Subscription.js";
import UserSubscription from "../models/UserSubscription.js";
import { generateReferralCode } from "../utils/referralCode.js";
dotenv.config();
// 🔹 Razorpay Instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});



export const initiateOnlinePayment = async (req, res) => {
  try {
    const { planId } = req.body;
    // console.log("Purchase Plan Request by User:", req.user.id, "for Plan ID:", planId);
    const plan = await Subscription.findById(planId);
    if (!plan || !plan.isActive) return res.status(400).json(apiResponse({ success: false, message: "Plan not found or inactive" }));

    // console.log("Selected Plan:", plan);

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json(apiResponse({ success: false, message: "User not found" }));


    const order = await razorpay.orders.create({
      amount: plan.price * 100,
      currency: "INR",
      receipt: `order_${Date.now()}_${plan?.code}`,
      payment_capture: 1,   // <-- yahi AUTO CAPTURE enable karta hai
    });


    const payment = await Payment.create({
      user: user._id,
      planType: plan.code,
      mode: "online",
      amount: plan.price,
      status: "pending",
      razorpayOrderId: order.id,
    });

    return res.json(apiResponse({
      success: true,
      message: "Razorpay order created successfully",
      data: { order, paymentId: payment._id, plan }
    }));
  } catch (err) {
    console.error(err);
    res.status(500).json(apiResponse({ success: false, message: "Payment initiation failed" }));
  }
};


export const verifyOnlinePayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentId,
    } = req.body;

    const payment = await Payment.findById(paymentId).populate("user");
    // console.log("Verifying Payment:", payment);
    if (!payment)
      return res
        .status(404)
        .json(apiResponse({ success: false, message: "Payment not found" }));

    // ✅ Razorpay Signature Verification
    const crypto = await import("crypto");
    const generated = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated !== razorpay_signature)
      return res
        .status(400)
        .json(apiResponse({ success: false, message: "Invalid payment signature" }));

    // ✅ Update Payment
    payment.status = "success";
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    await payment.save();

    // ✅ Update User
    const user = payment.user;
    user.isActive = true;
    user.planType = payment.planType;
    user.activatedAt = new Date();
    if (!user.referralCode) {
      user.referralCode = generateReferralCode();
    }
    await user.save();

    // ✅ Find Subscription Plan
    const plan = await Subscription.findOne({ code: payment.planType });
    if (!plan)
      return res
        .status(404)
        .json(apiResponse({ success: false, message: "Subscription plan not found" }));

    // ✅ Create User Subscription
    const resuser = await UserSubscription.create({
      user: req.user.id,
      subscription: plan._id,
      payment: payment._id,
      status: "active",
      activatedAt: new Date(),
    });

    // console.log("User Subscription Created:", resuser, user._id);
    // ✅ Credit Cashback (ONLY ONCE)
    // if (plan.cashback && plan.cashback > 0) {
    //   await updateWallet({
    //     userId: user._id,
    //     amount: plan.cashback,
    //     action: "activation_cashback",
    //     referenceId: payment._id.toString(),
    //     description: "Activation cashback credited",
    //   });
    // }

    // ✅ Referral Bonus Only for Plan A
    await handleReferralBonus(user._id);

    return res.json(
      apiResponse({
        success: true,
        message: "Payment verified & user activated",
        data: { id: user._id, userID: req.user.id, email: user.email, planType: user.planType },
      })
    );
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json(apiResponse({ success: false, message: "Payment verification failed" }));
  }
};

export const razorpayWebhook = async (req, res) => {
  try {
    const crypto = await import("crypto");
    const secret = process.env.RAZORPAY_KEY_SECRET;
    console.log(secret, "--------------------------")
    const receivedSignature = req.headers["x-razorpay-signature"];

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(req.body) // RAW BUFFER
      .digest("hex");

    if (receivedSignature !== expectedSignature) {
      return res.status(400).json({ status: "Invalid signature" });
    }

    const data = JSON.parse(req.body.toString());
    const event = data.event;

    if (event === "payment.captured") {
      console.log("Payment Captured:", data.payload.payment.entity);
    }

    return res.json({ status: "ok" });

  } catch (err) {
    console.log("Webhook Error:", err);
    res.status(500).json({ status: "failed" });
  }
};




// ✅ Step 3: Cash Activation Request
export const requestCashActivation = async (req, res) => {
  try {
    const { planId } = req.body;
    // console.log("Purchase Plan Request by User:", req.user.id, "for Plan ID:", planId);
    const plan = await Subscription.findById(planId);
    if (!plan || !plan.isActive) return res.status(400).json(apiResponse({ success: false, message: "Plan not found or inactive" }));


    const amount = plan.code === "A" ? 2400 : 999;
    const user = await User.findById(req.user.id);
    if (!user)
      return res
        .status(404)
        .json(apiResponse({ success: false, message: "User not found" }));
    // if (user.isActive)
    //   return res
    //     .status(400)
    //     .json(apiResponse({ success: false, message: "User already active" }));

    const payment = await Payment.create({
      user: user._id,
      planType: plan.code,
      mode: "cash",
      amount,
      status: "pending",
    });

    return res.json(
      apiResponse({ message: "Cash request sent to admin", data: payment })
    );
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json(apiResponse({ success: false, message: "Cash request failed" }));
  }
};


export const PendingCashRequests = async (req, res) => {
  try {
    const pending = await Payment.find({ mode: "cash", status: "pending" })
      .populate("user", "name email phone")
      .sort({ createdAt: -1 });

    return res.json(apiResponse({ data: pending }));
  } catch (err) {
    return res.status(500).json(apiResponse({ success: false, message: "Failed to fetch pending requests" }));
  }
};

// export const approveCashActivation = async (req, res) => {
//   try {
//     const { userId, paymentId } = req.params;
//     const adminId = req.user.id;

//     const payment = await Payment.findById(paymentId).populate("user");
//     if (!payment)
//       return res.status(404).json(apiResponse({ success: false, message: "Payment not found" }));

//     const planCode = payment.planType; 
//     const user = await User.findById(userId);
//     if (!user)
//       return res.status(404).json(apiResponse({ success: false, message: "User not found" }));


//     // Get user active subscription
//     const activeSub = await UserSubscription.findOne({
//       user: user._id,
//       status: "active",
//     }).sort({ createdAt: -1 });


//     // Ranking for upgrade system
//     const planRank = { B: 1, A: 2 };
//     // B = small (999), A = big (2400)


//     if (activeSub) {
//       const currentPlan = activeSub.planCode;

//       // SAME PLAN ❌ NOT ALLOWED
//       if (currentPlan === planCode) {
//         return res.status(400).json(apiResponse({
//           success: false,
//           message: `User already has plan ${planCode}. Cannot buy same plan again.`,
//         }));
//       }

//       // ❌ DOWNGRADE NOT ALLOWED (like A → B)
//       if (planRank[planCode] < planRank[currentPlan]) {
//         return res.status(400).json(apiResponse({
//           success: false,
//           message: `User already has higher plan (${currentPlan}). Downgrade to ${planCode} not allowed.`,
//         }));
//       }

//       // ✔ UPGRADE (B → A)
//       if (planRank[planCode] > planRank[currentPlan]) {
//         activeSub.status = "expired";
//         activeSub.expiresAt = new Date();
//         await activeSub.save();
//       }
//     }


//     // APPROVE PAYMENT
//     payment.status = "success";
//     payment.approvedBy = adminId;
//     payment.approvedAt = new Date();
//     await payment.save();


//     // USER UPDATE
//     user.isActive = true;
//     user.planType = planCode;
//     user.activatedAt = new Date();

//     if (!user.referralCode) {
//       user.referralCode = generateReferralCode();
//     }
//     await user.save();


//     // FIND SUBSCRIPTION PLAN
//     const plan = await Subscription.findOne({ code: planCode });

//     // CREATE NEW ACTIVE SUBSCRIPTION
//     await UserSubscription.create({
//       user: user._id,
//       subscription: plan._id,
//       payment: payment._id,
//       status: "active",
//       activatedAt: new Date(),
//       planCode,
//     });


//     // REFERRAL BONUS
//     await handleReferralBonus(user._id);


//     return res.json(apiResponse({
//       message: "Cash activation approved successfully",
//       data: user,
//     }));

//   } catch (err) {
//     console.error(err);
//     return res.status(500).json(apiResponse({
//       success: false,
//       message: "Admin approval failed",
//     }));
//   }
// };

export const approveCashActivation = async (req, res) => {
  try {
    const { userId, paymentId } = req.params;
    const adminId = req.user.id;

    const payment = await Payment.findById(paymentId).populate("user");
    if (!payment) {
      return res
        .status(404)
        .json(apiResponse({ success: false, message: "Payment not found" }));
    }

    const planCode = payment.planType;

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json(apiResponse({ success: false, message: "User not found" }));
    }

    // Find active subscription
    const activeSub = await UserSubscription.findOne({
      user: user._id,
      status: "active",
    }).sort({ createdAt: -1 });

    const planRank = { B: 1, A: 2 }; // B=999, A=2400

    if (activeSub) {
      const currentPlan = activeSub.planCode;

      // Same plan check
      if (currentPlan === planCode) {
        return res.status(400).json(
          apiResponse({
            success: false,
            message: `User already has plan ${planCode}. Cannot buy same plan again.`,
          })
        );
      }

      // Down grade not allowed
      if (planRank[planCode] < planRank[currentPlan]) {
        return res.status(400).json(
          apiResponse({
            success: false,
            message: `User already has higher plan (${currentPlan}). Downgrade to ${planCode} not allowed.`,
          })
        );
      }

      // Upgrade (B → A)
      if (planRank[planCode] > planRank[currentPlan]) {
        activeSub.status = "expired"; // must exist in model enum
        activeSub.expiresAt = new Date();
        await activeSub.save();
      }
    }

    // Approve payment
    payment.status = "success";
    payment.approvedBy = adminId;
    payment.approvedAt = new Date();
    await payment.save();

    // Update user
    user.isActive = true;
    user.planType = planCode;
    user.activatedAt = new Date();

    if (!user.referralCode) {
      user.referralCode = generateReferralCode();
    }
    await user.save();

    // Get subscription plan
    const plan = await Subscription.findOne({ code: planCode });

    await UserSubscription.create({
      user: user._id,
      subscription: plan._id,
      payment: payment._id,
      status: "active",
      activatedAt: new Date(),
      planCode,
    });

    // Referral bonus
    await handleReferralBonus(user._id);

    return res.json(
      apiResponse({
        success: true,
        message: "Cash activation approved successfully",
        data: user,
      })
    );
  } catch (err) {
    console.error("APPROVE ERROR:", err);
    return res.status(500).json(
      apiResponse({
        success: false,
        message: "Admin approval failed",
      })
    );
  }
};
