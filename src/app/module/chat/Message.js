import { Schema, model } from "mongoose";
const { ObjectId } = Schema.Types;

const messageSchema = new Schema(
  {
    sender: { type: ObjectId, ref: "User", required: true },
    receiver: { type: ObjectId, ref: "User", required: true },
    chatId: { type: ObjectId, ref: "Chat", required: true }, // এটি কুয়েরি ফাস্ট করবে
    
    // টেক্সট বা ক্যাপশন (এখন আর required নয়)
    message: { type: String, default: "" }, 

    // নতুন যোগ করা ফিল্ডস
    messageType: { 
      type: String, 
      enum: ["text", "image", "video", "audio", "file"], 
      default: "text" 
    },
    fileUrl: { type: String, default: null }, // ইমেজের বা ভিডিওর লিঙ্ক
    
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Message = model("Message", messageSchema);
export default Message;