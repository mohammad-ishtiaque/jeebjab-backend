import AdminNotification from "../app/module/notification/AdminNotification.js";
import Notification from "../app/module/notification/Notification.js";
import ApiError from "../error/ApiError.js";
import { errorLogger } from "./logger.js";
import mongoose from "mongoose";

/**
 * Creates a notification for admin(s) or a specific user.
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string|null} toId - Target user ID (null = admin notification)
 */
const postNotification = async (title, message, toId = null) => {
  // Validation — trim করে check করো
  if (!title?.trim() || !message?.trim()) {
    throw new ApiError(400, "Title and message are required");
  }

  // toId দিলে valid ObjectId কিনা check করো
  if (toId && !mongoose.Types.ObjectId.isValid(toId)) {
    throw new ApiError(400, `Invalid user ID: ${toId}`);
  }

  try {
    if (!toId) {
      await AdminNotification.create({ title: title.trim(), message: message.trim() });
    } else {
      await Notification.create({ toId, title: title.trim(), message: message.trim() });
    }
  } catch (error) {
    errorLogger.error(`Failed to create notification: ${error.message}`);
    throw new ApiError(500, "Notification could not be created");
  }
};

export default postNotification;