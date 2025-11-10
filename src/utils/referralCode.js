// src/utils/referralCode.js
import crypto from "crypto";

// Function to generate SmartSaving branded referral code
export const generateReferralCode = (prefix = "SS-R") => {

  const random = crypto.randomBytes(4).toString("hex").toUpperCase(); 
  return `${prefix}-${random}`; // e.g., SS-R-2025-8DJ4KX1
};
