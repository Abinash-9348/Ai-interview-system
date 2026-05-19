import mongoose from "mongoose";

const jdSchema = new mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: false,
       default:""
    },

    pdfUrl: { 
      type: String,
      required: false,
       default:""
    },

    rawText: {
      type: String,
       default:""
    },

    extractedSkills: [
      {
        type: String,
      },
    ],

    generatedQuestions: [
      {
        type: {
          type: String,
          enum: ["coding", "scenario", "hr"],
        },

        question: {
          type: String,
        },
      },
    ],

    status: {
      type: String,
      enum: ["draft", "active", "closed"],
      default: "draft",
    },
  },
  {
    timestamps: true,
  }
);

export const JD = mongoose.model("JD", jdSchema);