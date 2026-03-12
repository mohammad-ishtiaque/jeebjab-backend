import { status as httpStatus } from "http-status";
import { EnumSocketEvent } from "../util/enum.js";

const emitError = (
  socket,
  statusCode = httpStatus.INTERNAL_SERVER_ERROR,
  message = "Internal server error",
  disconnect = false
) => {
  // ১. ক্লায়েন্টকে প্রফেশনাল ফরম্যাটে এরর পাঠানো
  socket.emit(EnumSocketEvent.SOCKET_ERROR || "error", { 
    success: false,
    status: statusCode, 
    message 
  });

  // ২. লগিং (ডিবাগিংয়ের জন্য সুবিধাজনক)
  console.error(`🔌 [Socket Error]: ${message} (${statusCode})`);

  // ৩. ফোর্স ডিসকানেক্ট লজিক
  if (disconnect) {
    console.log("⚠️ Disconnecting socket due to critical error.");
    socket.disconnect(true);
  }

  // ৪. Apex Tip: এখানে throw না করে return করা নিরাপদ। 
  // তবে তুমি যদি socketCatchAsync ব্যবহার করো, তবে এটি প্রসেস থামাবে না।
};

export default emitError;