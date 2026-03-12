import { EnumSocketEvent } from "../util/enum.js";
import socketCatchAsync from "../util/socketCatchAsync.js";
import ChatSocketController from "./chat.socket.controller.js";
import SocketController from "./socket.controller.js";

const socketHandlers = socketCatchAsync(async (socket, io) => {
  // ১. ইউজার ডাটা বের করা (আমরা আগে মিডলওয়্যারে যে socket.user সেট করেছিলাম তা এখানে ব্যবহার করা বেস্ট)
  // যদি মিডলওয়্যার না থাকে তবে নিচের লাইনটি ঠিক আছে:
  const userId = socket.handshake.query.userId; 

  console.log(`⚡ Attempting to connect: ${userId}`);

  // ২. সিকিউরিটি চেক
  const user = await SocketController.validateUser(socket, io, { userId });
  if (!user) {
    console.error(`❌ Connection rejected: Invalid User ${userId}`);
    return socket.disconnect(); // অবৈধ ইউজারকে ডিসকানেক্ট করে দেওয়া ভালো
  }

  // ৩. রুম জয়েনিং (Private Messaging-এর জন্য)
  socket.join(userId);
  console.log(`✅ User ${userId} is now in their private room.`);

  // ৪. অনলাইন স্ট্যাটাস
  await SocketController.updateOnlineStatus(socket, io, {
    userId,
    isOnline: true,
  });

  // --- ইভেন্ট হ্যান্ডেলার্স ---

  // লোকেশন আপডেট (ড্রাইভারদের জন্য)
  socket.on(EnumSocketEvent.TRIP_DRIVER_LOCATION_UPDATE, (payload) => {
    SocketController.updateDriverLocation(socket, io, { ...payload, userId });
  });

  // মেসেজ পাঠানো
  socket.on(EnumSocketEvent.SEND_MESSAGE, async (payload) => {
    // এখানে পে লোডের সাথে userId পাঠিয়ে দিচ্ছি যাতে কন্ট্রোলার জানে প্রেরক কে
    ChatSocketController.sendMessage(socket, io, { ...payload, senderId: userId });
  });

  // ডিসকানেক্ট হ্যান্ডেলিং
  socket.on(EnumSocketEvent.DISCONNECT, () => {
    SocketController.updateOnlineStatus(socket, io, {
      userId,
      isOnline: false,
    });
    console.log(`🔌 User ${userId} disconnected`);
  });
});

export default socketHandlers;