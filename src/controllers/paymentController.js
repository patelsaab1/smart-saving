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
    console.log("Verifying Payment:", payment);
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

    console.log("User Subscription Created:", resuser, user._id);
    // ✅ Credit Cashback (ONLY ONCE)
    if (plan.cashback && plan.cashback > 0) {
      await updateWallet({
        userId: user._id,
        amount: plan.cashback,
        action: "activation_cashback",
        referenceId: payment._id.toString(),
        description: "Activation cashback credited",
      });
    }

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



// ✅ Step 3: Cash Activation Request
export const requestCashActivation = async (req, res) => {
  try {
    const { planId } = req.body;
    console.log("Purchase Plan Request by User:", req.user.id, "for Plan ID:", planId);
    const plan = await Subscription.findById(planId);
    if (!plan || !plan.isActive) return res.status(400).json(apiResponse({ success: false, message: "Plan not found or inactive" }));

    console.log("Selected Plan:", plan);

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
export const approveCashActivation = async (req, res) => {
  try {
    const { userId, paymentId } = req.params;
    const adminId = req.user.id;

    const payment = await Payment.findById(paymentId).populate("user");
    if (!payment)
      return res.status(404).json(apiResponse({ success: false, message: "Payment not found" }));

    payment.status = "success";
    payment.approvedBy = adminId;
    payment.approvedAt = new Date();
    await payment.save();

    const user = await User.findById(userId);
    user.isActive = true;
    user.planType = payment.planType;
    user.activatedAt = new Date();
    if (!user.referralCode) {
      user.referralCode = generateReferralCode();
    }
    await user.save();

    const cashbackAmount = payment.planType === "A" ? 500 : 250;

    // ✅ Subscription Handling
    const plan = await Subscription.findOne({ code: payment.planType });

    const existingSub = await UserSubscription.findOne({ user: user._id })
      .sort({ createdAt: -1 });

    if (existingSub && existingSub.status === "active") {
      // already active → do nothing
    } else if (existingSub && existingSub.status === "pending") {
      existingSub.status = "active";
      existingSub.activatedAt = new Date();
      await existingSub.save();
    } else {
      await UserSubscription.create({
        user: user._id,
        subscription: plan._id,
        payment: payment._id,
        status: "active",
        activatedAt: new Date(),
        planCode: payment.planType,
      });
    }
    console.log("User Subscription Result:", res);
    await updateWallet({
      userId: user._id,
      amount: cashbackAmount,
      action: "activation_cashback",
      referenceId: payment._id.toString(),
      description: "Activation cashback credited",
    });

    await handleReferralBonus(user._id);

    return res.json(apiResponse({ message: "Cash activation approved & user activated" ,data:user}));
  } catch (err) {
    console.error(err);
    res.status(500).json(apiResponse({ success: false, message: "Admin approval failed" }));
  }
};
