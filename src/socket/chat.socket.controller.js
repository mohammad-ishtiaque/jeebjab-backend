import httpStatus from "http-status"; // ফিক্সড ইমপোর্ট
import Chat from "../app/module/chat/Chat.js";
import Message from "../app/module/chat/Message.js";
import { EnumSocketEvent } from "../util/enum.js";
import postNotification from "../util/postNotification.js";
import emitError from "./emitError.js";
import emitResult from "./emitResult.js";
import socketCatchAsync from "../util/socketCatchAsync.js";
import validateSocketFields from "../util/validateSocketFields.js";

const sendMessage = socketCatchAsync(async (socket, io, payload) => {
  const isValid = validateSocketFields(socket, payload, ["receiverId", "chatId", "userId"]);
  if (!isValid) return; 

  const { userId, receiverId, chatId, message, messageType, fileUrl } = payload;

  if (!message && !fileUrl) {
    return emitError(socket, httpStatus.BAD_REQUEST, "Message or file is required");
  }

  const existingChat = await Chat.findOne({
    _id: chatId,
    participants: { $all: [userId, receiverId] },
  });

  if (!existingChat) {
    return emitError(socket, httpStatus.NOT_FOUND, "Chat not found or you are not a participant");
  }

  const newMessage = await Message.create({
    sender: userId,
    receiver: receiverId,
    chatId: chatId, 
    message: message || "", 
    messageType: messageType || "text", 
    fileUrl: fileUrl || null, 
  });

  // ফিক্সড: শুধু lastMessage আপডেট হবে, কোনো $push হবে না
  await Chat.findByIdAndUpdate(chatId, {
    $set: { lastMessage: newMessage._id }
  });

  const notificationBody = messageType === "text" ? message : `📷 Sent a ${messageType}`;
  postNotification("New message", notificationBody, receiverId);

  const response = emitResult({
    statusCode: httpStatus.OK,
    success: true,
    message: "New message received",
    data: newMessage,
  });

  io.to(userId).emit(EnumSocketEvent.SEND_MESSAGE, response);
  io.to(receiverId).emit(EnumSocketEvent.SEND_MESSAGE, response);

  return newMessage;
});

export default { sendMessage };