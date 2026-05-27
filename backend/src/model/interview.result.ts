import mongoose from "mongoose";
import {answerSchema} from "./answer.model.ts";
const interviewResultSchema =
  new mongoose.Schema(

    {

      interviewId: {

        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Interview",
      },

      candidateId: {

        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",
      },

      roomId: String,

      answers: [answerSchema

      ],

      overallScore: {

        type: Number,

        default: 0,
      },

      cheatingScore: {

        type: Number,

        default: 100,
      },

      finalFeedback: String,

    },

    {
      timestamps: true,
    }
  );

export const InterviewResult =
  mongoose.model(
    "InterviewResult",
    interviewResultSchema
  );