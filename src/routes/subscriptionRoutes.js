import express from "express";

import {
  createPlan,
  togglePlanStatus,
  getActivePlans,
  getMySubscription,

} from "../controllers/subscriptionController.js";
import { adminMiddleware, authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Admin Routes
router.post("/admin/create",  adminMiddleware, createPlan);
router.patch("/admin/toggle/:id",  adminMiddleware, togglePlanStatus);
// routes/subscription.js
router.get("/my", authMiddleware, getMySubscription);

// User Routes
router.get("/plans", getActivePlans);


export default router;