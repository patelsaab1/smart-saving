import UserActivity from "../models/UserActivity.js";

export const createActivity = async (userId, type, points = 0, coins = 0, metadata = {}) => {
  const activity = new UserActivity({
    user: userId,
    type,
    pointsEarned: points,
    coinsEarned: coins,
    metadata,
  });
  return await activity.save();
};

export const getUserActivities = async (userId) => {
  return await UserActivity.find({ user: userId }).sort({ createdAt: -1 });
};

export const getAllActivities = async () => {
  return await UserActivity.find().populate("user", "name email phone").sort({ createdAt: -1 });
};
