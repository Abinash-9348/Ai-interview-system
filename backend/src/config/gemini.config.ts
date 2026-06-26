
import {
  GoogleGenerativeAI
} from "@google/generative-ai";





console.log("evalut api",process.env.evalute_api);

const genAI =
  new GoogleGenerativeAI(

    process.env
      .evalute_api!
  );

export const model =
  genAI.getGenerativeModel({


     model: "gemini-2.0-flash",
  });

