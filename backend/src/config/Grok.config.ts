// import { GoogleGenerativeAI } from "@google/generative-ai";
// import dotenv from "dotenv";

// dotenv.config();

// const genAI = new GoogleGenerativeAI(
//   process.env.GEMINI_API_KEY!
// );

// export const model = genAI.getGenerativeModel({
//   model: "gemini-1.5-pro"
// });
import Groq from "groq-sdk";

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});