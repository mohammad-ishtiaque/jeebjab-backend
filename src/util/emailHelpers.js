import { errorLogger } from "../util/logger.js";
import ApiError from "../error/ApiError.js";
import { sendEmail } from "./sendEmail.js";
import signUpEmailTemp from "../mail/signUpEmailTemp.js";
import otpResendTemp from "../mail/otpResendTemp.js";
import resetPassEmailTemp from "../mail/resetPassEmailTemp.js";
import addAdminEmailTemp from "../mail/addAdminEmailTemp.js";

const createEmailSender = (subject, templateFn) => {
  return async (email, data) => {
    try {
      await sendEmail({ email, subject, html: templateFn(data) });
    } catch (error) {
      errorLogger.error(`Failed to send email to ${email}: ${error.message}`);
      throw new ApiError(500, "Email could not be sent");
    }
  };
};

const EmailHelpers = {
  sendActivationEmail: createEmailSender("Activate Your Account", signUpEmailTemp),
  sendOtpResendEmail: createEmailSender("New Activation Code", otpResendTemp),
  sendResetPasswordEmail: createEmailSender("Password Reset Code", resetPassEmailTemp),
  sendAddAdminEmail: createEmailSender("Admin Account Created", addAdminEmailTemp),
};

export default EmailHelpers;