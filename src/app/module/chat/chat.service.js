import httpStatus from "http-status";
import Chat from "./Chat.js";
import Message from "./Message.js";
import User from "../user/User.js";
import ApiError from "../../../error/ApiError.js";
import validateFields from "../../../util/validateFields.js";

const postChat = async (userData, payload) => {
  const { userId } = userData;
  const { receiverId } = payload;
  validateFields(payload, ["receiverId"]);

  const existingChat = await Chat.findOne({
    participants: { $all: [userId, receiverId] },
  });

  if (existingChat) return existingChat;

  return await Chat.create({
    participants: [userId, receiverId],
  });
};

const getChatMessages = async (query) => {
  validateFields(query, ["chatId"]);
  
  // chatId দিয়ে সরাসরি Message মডেল থেকে মেসেজ আনা (ফাস্ট কুয়েরি)
  const messages = await Message.find({ chatId: query.chatId })
    .sort({ createdAt: 1 }) // পুরনো থেকে নতুন
    .populate("sender receiver", "name profile_image");

  return messages;
};

const getAllChats = async (userData) => {
  const userId = userData.userId;

  // অ্যাগ্রিগেশন লজিক: আনরিড মেসেজ কাউন্ট সহ
  return await Chat.aggregate([
    { $match: { participants: { $in: [userId] } } },
    {
      $lookup: {
        from: "messages",
        let: { chatId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$chatId", "$$chatId"] } } },
          { $match: { isRead: false, receiver: userId } },
          { $count: "count" }
        ],
        as: "unreadCount"
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "participants",
        foreignField: "_id",
        as: "participantDetails"
      }
    },
    {
      $addFields: {
        unreadCount: { $ifNull: [{ $arrayElemAt: ["$unreadCount.count", 0] }, 0] }
      }
    }
  ]);
};


const uploadChatMedia = async (req) => {
  if (!req.files || !req.files.chat_media) {
    throw new ApiError(status.BAD_REQUEST, "No media file uploaded");
  }

  const files = req.files.chat_media;

  // প্রতিটি ফাইলের জন্য URL এবং Type জেনারেট করা
  const mediaData = files.map((file) => {
    const isImage = file.mimetype.startsWith("image");
    const isVideo = file.mimetype.startsWith("video");
    
    return {
      // মনে রাখবে: .env ফাইলে তোমার সার্ভারের URL থাকতে হবে
      fileUrl: `/uploads/chat_media/${file.filename}`,
      messageType: isImage ? "image" : isVideo ? "video" : "file",
    };
  });

  // যদি একটি ফাইল হয় তবে অবজেক্ট দিবে, বেশি হলে অ্যারে
  return mediaData.length === 1 ? mediaData[0] : mediaData;
};

const updateMessageAsSeen = async (userData, payload) => {
  const userId = userData.userId; 
  validateFields(payload, ["chatId"]);

  const chat = await Chat.findById(payload.chatId).lean();
  if (!chat) throw new ApiError(httpStatus.NOT_FOUND, "Chat not found");

  // আনরিড মেসেজগুলোকে রিড হিসেবে মার্ক করা
  const result = await Message.updateMany(
    {
      chatId: payload.chatId, // পারফরম্যান্স অপ্টিমাইজেশনের জন্য chatId ব্যবহার করা ভালো
      receiver: userId,
      isRead: false,
    },
    {
      $set: { isRead: true },
    }
  );

  return result;
};



export default { postChat, getChatMessages, getAllChats,updateMessageAsSeen, uploadChatMedia };