import { Schema, model } from "mongoose";
const { ObjectId } = Schema.Types;

const chatSchema = new Schema(
  {
    participants: [
      {
        type: ObjectId,
        ref: "User",
        required: true,
      },
    ],
    // পারফরম্যান্সের জন্য শুধু লাস্ট মেসেজ ট্র্যাক করা
    lastMessage: {
      type: ObjectId,
      ref: "Message",
    },
  },
  {
    timestamps: true,
  }
);

const Chat = model("Chat", chatSchema);
export default Chat;