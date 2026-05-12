import mongoose from "mongoose";
const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  language: { type: String, default: "" },
  code: { type: String, default: "" },
  isLocked: { type: Boolean, default: false },
createdBy: {
  userId: String,
  name: String
},
approvedUser:[
  {
     userId: String,
      name: String,
  }
],
  pendingUsers: [
    {
      userId: String,
      name: String,
    }
  ]
}, { timestamps: true });

export const Room = mongoose.model("Room", roomSchema);