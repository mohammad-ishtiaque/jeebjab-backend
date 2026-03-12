import { status } from "http-status";
import User from "../app/module/user/user.model.js"; // পাথটি তোমার প্রজেক্ট অনুযায়ী চেক করে নিও
import emitError from "./emitError.js";
import emitResult from "./emitResult.js";
import socketCatchAsync from "../util/socketCatchAsync.js";
import validateSocketFields from "../util/validateSocketFields.js";
import postNotification from "../util/postNotification.js";
import { EnumSocketEvent } from "../util/enum.js";

// ১. ইউজার ভ্যালিডেশন লজিক
const validateUser = socketCatchAsync(async (socket, io, payload) => {
  if (!payload.userId) {
    emitError(socket, status.BAD_REQUEST, "userId is required to connect", "disconnect");
    return null;
  }

  const user = await User.findById(payload.userId);

  if (!user) {
    emitError(socket, status.NOT_FOUND, "User not found", "disconnect");
    return null;
  }

  return user;
});

// ২. অনলাইন/অফলাইন স্ট্যাটাস আপডেট
const updateOnlineStatus = socketCatchAsync(async (socket, io, payload) => {
  validateSocketFields(socket, payload, ["userId", "isOnline"]);
  const { userId, isOnline } = payload;

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { isOnline },
    { new: true }
  );

  // ইউজারকে ফিডব্যাক পাঠানো
  socket.emit(
    EnumSocketEvent.ONLINE_STATUS,
    emitResult({
      statusCode: status.OK,
      success: true,
      message: `You are now ${updatedUser.isOnline ? "online" : "offline"}`,
      data: { isOnline: updatedUser.isOnline },
    })
  );
});

// ৩. লোকেশন আপডেট লজিক
const updateLocation = socketCatchAsync(async (socket, io, payload) => {
  validateSocketFields(socket, payload, ["userId", "lat", "long"]);
  const { userId, lat, long } = payload;

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { 
      locationCoordinates: { 
        type: "Point", 
        coordinates: [Number(long), Number(lat)] 
      } 
    },
    { new: true, runValidators: true }
  );

  // ব্রডকাস্ট: সব কানেক্টেড ইউজারকে লোকেশন জানানো
  io.emit(
    EnumSocketEvent.LOCATION_UPDATE,
    emitResult({
      statusCode: status.OK,
      success: true,
      message: "Location updated successfully",
      data: updatedUser,
    })
  );
});

// এক্সপোর্ট অবজেক্ট (ESM Standard)
const SocketController = {
  validateUser,
  updateOnlineStatus,
  updateLocation,
};

export default SocketController;