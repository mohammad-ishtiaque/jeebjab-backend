/**
 * কেন এই পরিবর্তন: 
 * ESM-এ 'export default' ব্যবহার করা সবচেয়ে ক্লিন পদ্ধতি।
 */
const socketCatchAsync = (fn) => {
  return async (socket, io, payload) => {
    try {
      return await fn(socket, io, payload);
    } catch (error) {
      // সকেট এরর লগ করা হচ্ছে যাতে সার্ভার ক্রাশ না করে
      console.error("🔌 [Socket Error]:", error.message);
      
      // ক্লায়েন্টকে এরর জানানো (ঐচ্ছিক কিন্তু প্রফেশনাল)
      socket.emit("error_response", {
        success: false,
        message: error.message || "Internal Socket Error",
      });
    }
  };
};

export default socketCatchAsync;