import { Request,Response } from "express";
import { JD } from "../model/jd.model.ts";
//import { model } from "../config/gemini.config.ts";
import { createQuestionPrompt } from "../utils/prompt.ts";
import { Interview } from "../model/interview.model.ts";
import { groq } from "../config/Grok.config.ts";


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


import { model as geminiModel } from "../config/gemini.config.ts";
import { AuthRequest } from "../types/express.ts";
import { InterviewResult } from "../model/interview.result.ts";

export const generateQuestionController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { jdid } = req.params;
    const { roomId } = req.body;

    if (!jdid) {
      return res.status(400).json({
        success: false,
        message: "JD id is required",
      });
    }

    const jd = await JD.findById(jdid);

    if (!jd) {
      console.warn(
        `[QUESTION_GEN] ❌ JD not found with ID: "${jdid}"`
      );

      return res.status(404).json({
        success: false,
        message: "JD not found",
      });
    }

    if (!req.user) {
      console.warn(
        "[QUESTION_GEN] ❌ Unauthorized: req.user is missing"
      );

      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // 1. DUPLICATE CHECK: If questions already generated on JD, return them directly
    if (jd.generatedQuestions && jd.generatedQuestions.length >= 15) {
      console.log(`[QUESTION_GEN] ℹ️ Returning ${jd.generatedQuestions.length} already generated questions for JD: "${jdid}"`);

      let interview = await Interview.findOne({
        roomId,
        candidateId: req.user.id,
        jdId: jd._id
      });

      if (!interview) {
        interview = await Interview.create({
          jdId: jd._id,
          candidateId: req.user.id,
          roomId,
        });
        console.log(`[QUESTION_GEN] ✅ New interview created for reconnecting/new candidate: ${interview._id}`);
      } else {
        console.log(`[QUESTION_GEN] ℹ️ Re-using existing interview: ${interview._id}`);
      }

      return res.status(200).json({
        success: true,
        data: jd.generatedQuestions,
        interviewId: interview._id,
        roomId,
      });
    }

    if (!jd.rawText) {
      console.warn(
        `[QUESTION_GEN] ⚠️ JD raw text is empty for ID: "${jdid}"`
      );

      return res.status(400).json({
        success: false,
        message: "JD text not found",
      });
    }

    console.log(
      "[QUESTION_GEN] 📝 Generating question prompt from JD raw text..."
    );

    const prompt = createQuestionPrompt(
      jd.rawText
    );

    console.log(
      "[QUESTION_GEN] 🤖 Calling Groq API..."
    );

    let parsedResponse: any = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts && !parsedResponse) {
      attempts++;
      try {
        const completion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
        });

        const rawResponse = completion.choices?.[0]?.message?.content || "";
        console.log(`[QUESTION_GEN] 📥 Groq Response (Attempt ${attempts}): received.`);

        let cleanedResponse = rawResponse
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();

        // Regex lookup as fallback to isolate JSON
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanedResponse = jsonMatch[0];
        }

        parsedResponse = JSON.parse(cleanedResponse);
        
        // Validate required keys
        if (!parsedResponse.coding || !parsedResponse.scenario || !parsedResponse.hr) {
          throw new Error("Missing required JSON structural keys.");
        }
      } catch (err: any) {
        console.warn(`[QUESTION_GEN] ⚠️ Attempt ${attempts} parsing failed:`, err.message);
        if (attempts >= maxAttempts) {
          console.error("[QUESTION_GEN] 🚨 All question generation attempts failed. Applying default fallback questions.");
        }
      }
    }

    // 2. FALLBACK QUESTIONS (If LLM/Parsing completely fails)
    if (!parsedResponse) {
      parsedResponse = {
        coding: [
          "Explain the difference between synchronous and asynchronous code execution in JavaScript and when to use each.",
          "Describe how REST APIs manage stateless client-server communications and common HTTP status codes.",
          "What is the difference between Virtual DOM and Real DOM, and how does React optimize rendering performance?",
          "Explain the concept of middleware in Express.js and how it controls the request-response lifecycle.",
          "How does relational database indexing improve query performance, and what are its trade-offs?",
          "What are the differences between Git merge and Git rebase, and when would you choose one over the other?",
          "Explain how JSON Web Tokens (JWT) are structured and securely used for session management.",
          "Describe the differences between local storage, session storage, and cookies, and their security implications.",
          "What is CORS, why is it enforced by browsers, and how do you configure it in a backend server?",
          "Explain the difference between SQL and NoSQL databases, citing production use cases for each."
        ],
        scenario: [
          "Describe a situation where a production API became extremely slow. How would you diagnose, profile, and fix the bottleneck?",
          "Suppose you are tasked with upgrading an older software package in a large repository, but it breaks several downstream features. How do you handle this safely?",
          "A critical database migration fails halfway through deployment on a Friday evening. Walk me through your step-by-step resolution plan."
        ],
        hr: [
          "Why do you want to join our company, and what unique value do you bring to this specific role?",
          "Tell me about a time you had a strong technical disagreement with a team member. How did you communicate and resolve the conflict professionally?"
        ]
      };
    }

    const allQuestions = [
      ...parsedResponse.coding.map(
        (q: string) => ({
          type: "coding",
          question: q,
        })
      ),

      ...parsedResponse.scenario.map(
        (q: string) => ({
          type: "scenario",
          question: q,
        })
      ),

      ...parsedResponse.hr.map(
        (q: string) => ({
          type: "hr",
          question: q,
        })
      ),
    ];

    jd.generatedQuestions =
      allQuestions as any;

    await jd.save();

    console.log(
      "[QUESTION_GEN] 💾 Saved generated questions to JD document."
    );

    console.log(
      `[QUESTION_GEN] 🆕 Creating new Interview document for room: "${roomId}"`
    );

    const interview =
      await Interview.create({
        jdId: jd._id,
        candidateId: req.user.id,
        roomId,
      });

    console.log(
      `[QUESTION_GEN] ✅ Interview created with ID: ${interview._id}`
    );

    return res.status(200).json({
      success: true,
      data: jd.generatedQuestions,
      interviewId: interview._id,
      roomId,
    });
  } catch (error: any) {
    console.error(
      "[QUESTION_GEN] ❌ Error in generateQuestionController:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};


export const getInterviewResult = async (req: Request, res: Response) => {
  const { roomId } = req.params;
  console.log(`[GET_RESULT] 🔍 Fetching InterviewResult for roomId: "${roomId}"`);

  try {
    const result = await InterviewResult.findOne({ roomId });
    
    if (!result) {
      console.warn(`[GET_RESULT] ⚠️ No InterviewResult document found in DB for roomId: "${roomId}"`);
      
      // Fallback: Check if an Interview actually exists for this room
      const interviewExists = await Interview.findOne({ roomId });
      console.log(`[GET_RESULT] ℹ️ Associated Interview document exists for room: ${!!interviewExists}`);
      
      return res.json({
        success: true,
        message: "No interview results recorded yet.",
        result: null,
        hasInterview: !!interviewExists
      });
    }

    console.log(`[GET_RESULT] ✅ Found InterviewResult: ${result._id} with ${result.answers?.length || 0} answers for room: "${roomId}"`);
    
    // Sanitize answers list to exclude technical/communication scores, feedback, and correct answers
    const sanitizedAnswers = (result.answers || []).map((ans: any) => ({
      question: ans.question,
      answer: ans.answer,
      timeTaken: ans.timeTaken,
      wordCount: ans.wordCount
    }));

    // Construct a sanitized result object omitting overallScore, recommendation, cheatingScore, strengths, weaknesses, finalFeedback, and resultstatus
    const sanitizedResult = {
      _id: result._id,
      roomId: result.roomId,
      candidateId: result.candidateId,
      answers: sanitizedAnswers,
      createdAt: (result as any).createdAt,
      updatedAt: (result as any).updatedAt,
    };

    return res.json({
      success: true,
      result: sanitizedResult,
    });
  } catch (error: any) {
    console.error(`[GET_RESULT] ❌ Internal error fetching interview result:`, error);
    return res.status(500).json({
      msg: "internal error",
      error: error.message,
    });
  }
};