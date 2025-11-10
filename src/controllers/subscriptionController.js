import Subscription from "../models/Subscription.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import apiResponse from "../utils/apiResponse.js";
import UserSubscription from "../models/UserSubscription.js";

// === ADMIN: Create Plan ===
export const createPlan = async (req, res) => {

  try {
    const { name, code, price, cashback, hasReferral, description } = req.body;
    const plan = await Subscription.create({
      name,
      code,
      price,
      cashback,
      hasReferral,
      description,
      createdBy: req.user.id,
    });
    res.json(apiResponse({ success: true, data: plan }));
  } catch (err) {
    res.status(500).json(apiResponse({ success: false, message: err.message }));
  }
};

// === ADMIN: Toggle Plan Active/Inactive ===
export const togglePlanStatus = async (req, res) => {
  try {
    const plan = await Subscription.findById(req.params.id);
    if (!plan) return res.status(404).json(apiResponse({ success: false, message: "Plan not found" }));
    plan.isActive = !plan.isActive;
    await plan.save();
    res.json(apiResponse({ success: true, data: plan }));
  } catch (err) {
    res.status(500).json(apiResponse({ success: false, message: err.message }));
  }
};

// === USER: Get Active Plans ===
export const getActivePlans = async (req, res) => {
  try {
    const plans = await Subscription.find({ isActive: true }).select("-createdBy");
    res.json(apiResponse({ success: true, data: plans }));
  } catch (err) {
    res.status(500).json(apiResponse({ success: false, message: err.message }));
  }
};

// controllers/subscriptionController.js
export const getMySubscription = async (req, res) => {
  try {
    
    const sub = await UserSubscription.findOne({ 
      user: req.user.id,
      status: "active"
    })
      .sort({ activatedAt: -1 }) // ✅ Latest active plan
      .populate("subscription")
      .populate("payment")
      .populate("user");

     
       const user = await User.findById(req.user.id).select(
      "name email phone referralCode role planType activatedAt profilePic"
    );
    if (!sub) {
      return res.json(apiResponse({
        success: false,
        message: "No active plan found. Please purchase a plan."
      }));
    }

    return res.json(apiResponse({ success: true, data: sub }));
  } catch (err) {
    res.status(500).json(apiResponse({ success: false, message: err.message }));
  }
};
