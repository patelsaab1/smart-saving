import * as activityService from "../services/userActivityService.js";
import apiResponse from "../utils/apiResponse.js";

// ✅ Add Activity
export const addActivity = async (req, res) => {
  try {
    const { type, points = 0, coins = 0, metadata = {} } = req.body;
    const activity = await activityService.createActivity(req.user.id, type, points, coins, metadata);

    return res.json(apiResponse({ success: true, message: "Activity logged", data: activity }));
  } catch (err) {
    console.error(err);
    res.status(500).json(apiResponse({ success: false, message: "Failed to add activity" }));
  }
};

// ✅ Get My Activities
export const myActivities = async (req, res) => {
  try {
    const activities = await activityService.getUserActivities(req.user.id);
    return res.json(apiResponse({ success: true, data: activities }));
  } catch (err) {
    res.status(500).json(apiResponse({ success: false, message: "Failed to fetch activities" }));
  }
};

// ✅ Admin: Get All Activities
export const allActivities = async (req, res) => {
  try {
    const activities = await activityService.getAllActivities();
    return res.json(apiResponse({ success: true, data: activities }));
  } catch (err) {
    res.status(500).json(apiResponse({ success: false, message: "Failed to fetch activities" }));
  }
};
