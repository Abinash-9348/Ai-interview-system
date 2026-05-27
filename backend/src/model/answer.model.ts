import mongoose from "mongoose";

export const answerSchema =
  new mongoose.Schema({

    question: String,

    answer: String,

    technicalScore: {
      type: Number,
      default: 0,
    },

    communicationScore: {
      type: Number,
      default: 0,
    },

    confidenceScore: {
      type: Number,
      default: 0,
    },

    feedback: String,

    correctAnswer: String,

    timeTaken: Number,

    wordCount: Number,

  });
