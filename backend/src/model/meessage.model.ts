// models/message.model.ts
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true
    },
    user: {
      name: String,
      color: String
    },
    message: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);