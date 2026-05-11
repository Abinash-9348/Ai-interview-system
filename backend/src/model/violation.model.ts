import mongoose from "mongoose";

const violationSchema =
new mongoose.Schema({

  roomId: {
    type: String,
    required: true,
  },

  userId: {
    type: String,
    required: true,
  },

  username: {
    type: String,
    required: true,
  },

  lookingLeftTime: {
    type: Number,
    default: 0,
  },

  lookingRightTime: {
    type: Number,
    default: 0,
  },

  headMovementTime: {
    type: Number,
    default: 0,
  },

  multipleFaceTime: {
    type: Number,
    default: 0,
  },

  noFaceTime: {
    type: Number,
    default: 0,
  },
  tabinActive:{
   type: Number,
    default: 0,
  }

}, {
  timestamps: true,
});

export const Violation =
mongoose.model(
  "Violation",
  violationSchema
);