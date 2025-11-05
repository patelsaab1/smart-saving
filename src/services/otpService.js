import otpGenerator from "otp-generator";

// In-memory store (use Redis in prod)
const otpStore = new Map();

export const generateOTP = (email) => {
  const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false });
  const expiry = Date.now() + (process.env.OTP_EXPIRY * 60 * 1000);
  otpStore.set(email, { otp, expiry });
  return otp;
};

export const verifyOTP = (email, otp) => {
  const data = otpStore.get(email);
  if (!data || data.expiry < Date.now() || data.otp !== otp) return false;
  otpStore.delete(email);
  return true;
};


