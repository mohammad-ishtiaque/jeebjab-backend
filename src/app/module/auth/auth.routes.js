import express from "express";
import AuthController from "./auth.controller.js";
import  auth  from "../../middleware/auth.js";
import config from "../../../config/index.js";
import  limiter  from "../../middleware/limiter.js";

const router = express.Router();

router
  .post("/register", AuthController.registrationAccount)
  .post("/login", limiter.authLimiter, AuthController.loginAccount)
  .post("/activate-account", AuthController.activateAccount)
  .post("/activation-code-resend", AuthController.resendActivationCode)
  .post("/forgot-password", AuthController.forgotPass)
  .post("/forget-pass-otp-verify", AuthController.forgetPassOtpVerify)
  .post("/reset-password", AuthController.resetPassword)
  .patch(
    "/change-password",
    auth(config.auth_level.user),
    AuthController.changePassword
  );

export default router;
