import http from "http";
import { Server } from "socket.io"; // নিশ্চিত করো npm install socket.io করা আছে

import app from "../app.js"; 
import socketHandlers from "../socket/socketHandlers.js";
import socketCors from "./socketCors.js";
import { EnumSocketEvent } from "../util/enum.js";

// ১. HTTP সার্ভার তৈরি
const mainServer = http.createServer(app);

// ২. Socket.io সার্ভার ইনিশিয়ালাইজেশন
const io = new Server(mainServer, {
  cors: socketCors,
});

// ৩. কানেকশন ইভেন্ট লিসেনার
// ফলব্যাক হিসেবে "connection" স্ট্রিং রাখা ভালো যদি Enum ঠিকমতো কাজ না করে
io.on(EnumSocketEvent.CONNECTION || "connection", (socket) => {
  console.log(`🟢 New Socket Connection Triggered: ${socket.id}`);
  socketHandlers(socket, io);
});

// ৪. ESM এক্সপোর্ট
export default mainServer;