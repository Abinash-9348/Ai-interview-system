import axios from 'axios'
import { languageMap } from '../utils/language.version.ts'
import { Room } from '../model/room.model.ts'
import mongoose from 'mongoose'
import dotenv from "dotenv"
dotenv.config()

const BASE_URL = "https://ce.judge0.com";

type Judge0Response = {
  stdout?: string;
  stderr?: string;
  status?: {
    description: string;
  };
};


export const executeCodeService = async (data: any) => {
  try {
    const { roomId, code, input,language } = data; 
  
    if (!code) {
      throw new Error("Code is required");
    }
const room = await Room.findOne({ roomId:roomId });

const lang: string =
  room?.language?.toLowerCase() ||
  language?.toLowerCase() ||
  "";

if (!lang) {
  throw new Error("Language is required");
}

const language_id = languageMap[lang];

if (!language_id) {
  throw new Error(`Unsupported language: ${lang}`);
}

    const encodedCode = Buffer.from(code).toString("base64");
    const encodedInput = Buffer.from(input || "").toString("base64");

    const response = await axios.post(
      `${BASE_URL}/submissions?base64_encoded=true&wait=true`,
      {
        source_code: encodedCode,
        language_id,
        stdin: encodedInput
      }
    );

const result = response.data as Judge0Response
    const output = result.stdout
      ? Buffer.from(result.stdout, "base64").toString()
      : null;

    const error = result.stderr
      ? Buffer.from(result.stderr, "base64").toString()
      : null;

    return {
      output,
      error,
      status: result.status?.description
    };

  } catch (error: any) {
    console.log("ERROR:", error.response?.data || error.message);

    return {
      output: null,
      error: error.message,
      status: "Execution Failed"
    };
  }
};
