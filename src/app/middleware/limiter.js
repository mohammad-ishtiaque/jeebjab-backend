import rateLimit from "express-rate-limit";
import sendResponse from "../../util/sendResponse.js";

// ১. Strict Limiter: সেনসিটিভ রাউটের জন্য (যেমন: /login, /verify-otp)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // ১৫ মিনিট
  limit: 5, // ১৫ মিনিটে সর্বোচ্চ ৫ বার ভুল ট্রাই করতে পারবে
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: (req, res) => {
    sendResponse(res, {
      statusCode: 429, // FIXED: 429 হলো সঠিক স্ট্যাটাস কোড
      success: false,
      message: "Too many authentication attempts. Please try again after 15 minutes.",
    });
  },
});

// ২. Global Limiter: সাধারণ রাউটের জন্য (যেমন: ডেটা ফেচিং)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // ১৫ মিনিট (RAM সেভ করার জন্য উইন্ডো ছোট রাখা ভালো)
  limit: 100, // ১৫ মিনিটে ১০০ রিকোয়েস্ট 
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: (req, res) => {
    sendResponse(res, {
      statusCode: 429,
      success: false,
      message: "Too many requests from this IP, please try again later.",
    });
  },
});

const limiter = {
  authLimiter,
  globalLimiter,
};

export default limiter;