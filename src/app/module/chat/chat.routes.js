import express from "express";
import auth from "../../middleware/auth.js";
import config from "../../../config/index.js";
import ChatController from "./chat.controller.js";
// তোমার Multer মিডলওয়্যারটি ইমপোর্ট করা হলো
import { uploadFile } from "../../middleware/fileUploader.js"; 

const router = express.Router();

// ১. মিডিয়া আপলোড রুট (নতুন)
// ফ্রন্টএন্ড থেকে ফাইল পাঠানোর সময় 'chat_media' ফিল্ড ব্যবহার করতে হবে
router.post(
  "/upload-media",
  auth(config.auth_level.user),
  uploadFile(), // Multer মিডলওয়্যার ফাইলগুলো রিসিভ করবে
  ChatController.uploadChatMedia
);

// ২. নতুন চ্যাট শুরু করা
router.post(
  "/post-chat", 
  auth(config.auth_level.user), 
  ChatController.postChat
);

// ৩. চ্যাটের মেসেজগুলো নিয়ে আসা
router.get(
  "/get-chat-messages",
  auth(config.auth_level.user),
  ChatController.getChatMessages
);

// ৪. ইউজারের সব চ্যাট লিস্ট দেখা
router.get(
  "/get-all-chats",
  auth(config.auth_level.user),
  ChatController.getAllChats
);

// ৫. মেসেজ 'Seen' বা পড়া হয়েছে হিসেবে মার্ক করা (রিকভারড)
router.patch(
  "/update-message-as-seen",
  auth(config.auth_level.user),
  ChatController.updateMessageAsSeen
);

export default router;