import { Request,Response } from "express";
import { JD } from "../model/jd.model.ts";
//import { model } from "../config/gemini.config.ts";
import { createQuestionPrompt } from "../utils/prompt.ts";
import { Interview } from "../model/interview.model.ts";


// export const generateQuestionController =async(req:Request,res:Response)=>{
//  try {
//     const {jdid}=req.params
//     if(!jdid){
//         return res.status(404).json({msg:"jd is required"})
//     }
//      const jd = await JD.findById(jdid);

//     if (!jd) {

//       return res.status(404).json({
//         success: false,
//         message: "JD not found",
//       });

//     }
//     if(!jd.rawText){
//         return res.status(400).json({
//         success: false,
//         message: "JD text not found",
//       });
//     }
//     const prompt = createQuestionPrompt(jd.rawText)
//     console.log(prompt)
//     const result=await model.generateContent(prompt)
//     console.log(result.response.text());
//     const respose = result.response.text()
    
//     console.log("AI RESPONSE:");
//     console.log(respose);
//         const cleanResponse = respose
//       .replace(/```json/g, "")
//       .replace(/```/g, "")
//       .trim();
//      const parsedData =
//       JSON.parse(cleanResponse); 
//        const formattedQuestions = [

//       // CODING QUESTIONS

//       ...parsedData.coding.map(
//         (question: string) => ({
//           type: "coding",
//           question,
//         })
//       ),

//       // SCENARIO QUESTIONS

//       ...parsedData.scenario.map(
//         (question: string) => ({
//           type: "scenario",
//           question,
//         })
//       ),

//       // HR QUESTIONS

//       ...parsedData.hr.map(
//         (question: string) => ({
//           type: "hr",
//           question,
//         })
//       ),

//     ];
//     jd.generatedQuestions=formattedQuestions as any
//     await jd.save()
    

//  } catch (error:any) {
//      console.log({error:error.message});
//          if (error.status === 429) {
//       return res.status(429).json({
//         success: false,
//         message: "Gemini quota exceeded",
//       });
//     }

     

//     return res.status(500).json({

//       success: false,

//       message:
//         "Something went wrong",

//       error,

//     });
//  }
// }


import { groq } from "../config/Grok.config.ts"

import { AuthRequest } from "../types/express.ts";


export const generateQuestionController = async (
  req: AuthRequest,
  res: Response
) => {
  try {

    const { jdid } = req.params;
    const {roomId}=req.body
 

    if (!jdid) {
      return res.status(400).json({
        success: false,
        message: "JD id is required",
      });
    }

    const jd = await JD.findById(jdid);

    if (!jd) {
      return res.status(404).json({
        success: false,
        message: "JD not found",
      });
    }

    if (!jd.rawText) {
      return res.status(400).json({
        success: false,
        message: "JD text not found",
      });
    }

    const prompt = createQuestionPrompt(jd.rawText);

    const completion =
      await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.5,
      });

    const rawResponse =
      completion.choices[0].message.content || "";

    const cleanedResponse = rawResponse
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsedResponse = JSON.parse(cleanedResponse);

    const allQuestions = [
      ...parsedResponse.coding.map((q: string) => ({
        type: "coding",
        question: q,
      })),

      ...parsedResponse.scenario.map((q: string) => ({
        type: "scenario",
        question: q,
      })),

      ...parsedResponse.hr.map((q: string) => ({
        type: "hr",
        question: q,
      })),
    ];

    jd.generatedQuestions = allQuestions as any;

    await jd.save();
    if (!req.user) {

  return res.status(401).json({

    success: false,

    message: "Unauthorized",
  });
}
 const interview =
  await Interview.create({

    jdId: jd._id,

    candidateId:
      req.user.id,

    roomId:roomId
  });


   return res.status(200).json({

  success: true,

  data:
    jd.generatedQuestions,

  interviewId:
    interview._id,

  roomId,
});
  } catch (error: any) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};