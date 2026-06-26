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

      strengths: {
        type: [String],
        default: []
      },

      weaknesses: {
        type: [String],
        default: []
      },

      recommendation: {
        type: String,
        default: ""
      },

      finalFeedback: String,
       resultstatus:{
         type: String, enum: [ "PASSED", "DISQUALIFIED", ], default: "PASSED",
   }

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