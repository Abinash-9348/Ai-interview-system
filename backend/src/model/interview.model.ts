import mongoose from "mongoose";

const interviewSchema =
  new mongoose.Schema(
    {
      jdId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "JD",

        required: true,
      },

      candidateId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",

        required: true,
      },

      roomId: {
        type: String,

        required: true,
      },

      status: {
        type: String,

        enum: [
          "started",
          "completed",
          "disqualified",
        ],

        default: "started",
      },

      currentQuestionIndex: {
        type: Number,

        default: 0,
      },

      startedAt: {
        type: Date,

        default: Date.now,
      },

      endedAt: {
        type: Date,
      },

    },
    {
      timestamps: true,
    }
  );

export const Interview =
  mongoose.model(
    "Interview",
    interviewSchema
  );