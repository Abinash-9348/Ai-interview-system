import { InterviewResult } from "../model/interview.result.ts";
import { Interview } from "../model/interview.model.ts";
import { Violation } from "../model/violation.model.ts";
import { model as geminiModel } from "../config/gemini.config.ts";
import { evaluatePrompt, createFinalEvaluationPrompt } from "./prompt.ts";

/**
 * Silently evaluates a single candidate answer in the background.
 * Updates the InterviewResult.answers[] entry with scores and feedback.
 * Never emits to frontend. Never returns data to client.
 */
// Helper to validate single answer evaluation JSON structure
const isValidEvaluation = (res: any): boolean => {
  if (!res || typeof res !== "object") return false;
  
  const requiredNumericFields = [
    "technicalScore",
    "communicationScore",
    "confidenceScore",
    "accuracyScore",
    "clarityScore",
  ];
  
  for (const field of requiredNumericFields) {
    if (res[field] === undefined || res[field] === null || isNaN(Number(res[field]))) {
      return false;
    }
  }
  
  if (typeof res.feedback !== "string" || !res.feedback.trim()) return false;
  if (typeof res.correctAnswer !== "string" || !res.correctAnswer.trim()) return false;
  
  return true;
};

// Helper to validate aggregate evaluation JSON structure
const isValidFinalEvaluation = (res: any): boolean => {
  if (!res || typeof res !== "object") return false;
  if (res.overallScore === undefined || res.overallScore === null || isNaN(Number(res.overallScore))) return false;
  if (!Array.isArray(res.strengths)) return false;
  if (!Array.isArray(res.weaknesses)) return false;
  if (typeof res.recommendation !== "string" || !res.recommendation.trim()) return false;
  if (typeof res.finalFeedback !== "string" || !res.finalFeedback.trim()) return false;
  return true;
};

/**
 * Silently evaluates a single candidate answer in the background.
 * Updates the InterviewResult.answers[] entry with scores and feedback.
 * Never emits to frontend. Never returns data to client.
 */
export const evaluateAnswerInBackground = async (
  resultId: string,
  question: string,
  answer: string
) => {
  try {
    console.log(`[BG-EVAL] 🔄 Evaluating: "${question.substring(0, 50)}..."`);

    const prompt = evaluatePrompt(question, answer);
    let parsedResult: any = null;
    let attempts = 0;

    while (attempts < 3 && !parsedResult) {
      attempts++;
      try {
        const response = await geminiModel.generateContent(prompt);
        const text = response.response.text();
        let cleaned = text.replace(/```json|```/g, "").trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) cleaned = jsonMatch[0];
        const rawJson = JSON.parse(cleaned);

        if (isValidEvaluation(rawJson)) {
          parsedResult = rawJson;
        } else {
          console.warn(`[BG-EVAL] Attempt ${attempts} validation failed (missing/invalid fields in JSON)`);
        }
      } catch (err: any) {
        console.warn(
          `[BG-EVAL] Attempt ${attempts} JSON parse failed:`,
          err.message
        );
      }
    }

    // Fallback if all attempts fail
    if (!parsedResult) {
      parsedResult = {
        technicalScore: 5,
        communicationScore: 5,
        confidenceScore: 5,
        accuracyScore: 5,
        clarityScore: 5,
        feedback:
          "Evaluation could not be fully parsed. Default moderate score applied.",
        correctAnswer:
          "Ideal response evaluation failed. Please review transcript directly.",
      };
    }

    // Atomic update of the specific answer subdocument in MongoDB
    await InterviewResult.updateOne(
      { _id: resultId, "answers.question": question },
      {
        $set: {
          "answers.$.technicalScore":
            Number(parsedResult.technicalScore) || 0,
          "answers.$.communicationScore":
            Number(parsedResult.communicationScore) || 0,
          "answers.$.confidenceScore":
            Number(parsedResult.confidenceScore) || 0,
          "answers.$.accuracyScore":
            Number(parsedResult.accuracyScore) || 0,
          "answers.$.clarityScore":
            Number(parsedResult.clarityScore) || 0,
          "answers.$.feedback": parsedResult.feedback || "",
          "answers.$.correctAnswer": parsedResult.correctAnswer || "",
        },
      }
    );

    console.log(
      `[BG-EVAL] ✅ Silently evaluated and saved: "${question.substring(0, 50)}..."`
    );
  } catch (error: any) {
    console.error(`[BG-EVAL] ❌ Background evaluation error:`, error.message);
  }
};

/**
 * Runs the final aggregate evaluation after the interview ends.
 * Calculates cheating score, applies disqualification rules,
 * generates final recommendation via Gemini, and saves to MongoDB.
 * Completely silent — no socket emit, no API response, no UI update.
 */
export const runFinalEvaluationInBackground = async (
  roomId: string,
  userId: string
) => {
  try {
    console.log(
      `[BG-FINAL] 🏁 Starting final aggregate evaluation for room: ${roomId}`
    );

    // Wait for pending individual evaluations to finish
    await new Promise((resolve) => setTimeout(resolve, 15000));

    // Fetch the latest result with all evaluated answers
    const result = await InterviewResult.findOne({ roomId });
    if (!result) {
      console.warn(
        `[BG-FINAL] ⚠️ No InterviewResult found for room: ${roomId}`
      );
      return;
    }

    // Calculate overall score from all answers
    let overallScoreSum = 0;
    for (const ans of result.answers) {
      overallScoreSum +=
        (ans.technicalScore || 0) +
        (ans.communicationScore || 0) +
        (ans.confidenceScore || 0) +
        ((ans as any).accuracyScore || 0) +
        ((ans as any).clarityScore || 0);
    }

    // ========== ANTI-CHEATING PROCTORING ==========
    const violation = await Violation.findOne({
      roomId,
      userId: result.candidateId?.toString(),
    });

    let cheatingScore = 100;
    let multipleFaceCount = 0;
    let tabSwitchCount = 0;
    let headMovementCount = 0;

    if (violation) {
      multipleFaceCount = violation.multipleFaceTime || 0;
      tabSwitchCount = violation.tabinActive || 0;
      headMovementCount = violation.headMovementTime || 0;

      cheatingScore -= (violation.lookingLeftTime || 0) * 4;
      cheatingScore -= (violation.lookingRightTime || 0) * 4;
      cheatingScore -= (violation.headMovementTime || 0) * 3;
      cheatingScore -= (violation.multipleFaceTime || 0) * 15;
      cheatingScore -= (violation.tabinActive || 0) * 10;
      cheatingScore -= (violation.noFaceTime || 0) * 2;
    }

    if (cheatingScore < 0) cheatingScore = 0;
    result.cheatingScore = cheatingScore;

    // Disqualification rules
    if (
      multipleFaceCount > 2 ||
      tabSwitchCount > 3 ||
      headMovementCount > 5
    ) {
      result.resultstatus = "DISQUALIFIED";
      console.log(
        `[BG-FINAL] 🚨 CANDIDATE DISQUALIFIED DUE TO EXCESSIVE VIOLATIONS.`
      );
    } else {
      result.resultstatus = "PASSED";
    }

    // ========== FINAL AGGREGATE EVALUATION ==========
    let finalEvaluated: any = null;

    if (result.resultstatus === "DISQUALIFIED") {
      finalEvaluated = {
        overallScore: overallScoreSum,
        strengths: ["None (Disqualified)"],
        weaknesses: [
          "Suspicious user behavior",
          "Unusual activity detected",
        ],
        recommendation: "Reject",
        finalFeedback:
          "Candidate was disqualified automatically due to security violations including frequent tab-switching or presence of multiple faces.",
      };
    } else {
      const simplifiedAnswers = result.answers.map((a: any) => ({
        question: a.question,
        answer: a.answer,
        scores: {
          technical: a.technicalScore,
          communication: a.communicationScore,
          confidence: a.confidenceScore,
          accuracy: a.accuracyScore,
          clarity: a.clarityScore,
        },
        feedback: a.feedback,
      }));

      const proctoringInfo = `Cheating Score: ${cheatingScore}/100. Tab Switches: ${tabSwitchCount}. Multiple Faces: ${multipleFaceCount}. Head Movements: ${headMovementCount}.`;
      const finalPrompt = createFinalEvaluationPrompt(
        JSON.stringify(simplifiedAnswers, null, 2),
        proctoringInfo
      );

      let aggregateAttempts = 0;
      while (aggregateAttempts < 3 && !finalEvaluated) {
        aggregateAttempts++;
        try {
          const finalResponse =
            await geminiModel.generateContent(finalPrompt);
          let finalText = finalResponse.response.text();
          let cleanedFinal = finalText
            .replace(/```json|```/g, "")
            .trim();
          const jsonMatch = cleanedFinal.match(/\{[\s\S]*\}/);
          if (jsonMatch) cleanedFinal = jsonMatch[0];
          const rawJson = JSON.parse(cleanedFinal);

          if (isValidFinalEvaluation(rawJson)) {
            finalEvaluated = rawJson;
          } else {
            console.warn(`[BG-FINAL] Aggregate attempt ${aggregateAttempts} validation failed (missing/invalid fields in JSON)`);
          }
        } catch (err: any) {
          console.warn(
            `[BG-FINAL] Aggregate attempt ${aggregateAttempts} failed:`,
            err.message
          );
        }
      }

      // Fallback if Gemini aggregate fails
      if (!finalEvaluated) {
        const avgScore =
          overallScoreSum / (result.answers.length || 1);
        let recommendation = "Consider";
        if (avgScore >= 35) recommendation = "Strong Hire";
        else if (avgScore >= 25) recommendation = "Hire";
        else if (avgScore < 15) recommendation = "Reject";

        finalEvaluated = {
          overallScore: overallScoreSum,
          strengths: [
            "Communicates technical concepts",
            "Demonstrates core technology understanding",
          ],
          weaknesses: [
            "Could provide deeper implementation details",
          ],
          recommendation,
          finalFeedback:
            "The interview was completed successfully. Candidate performed moderately across core technical aspects.",
        };
      }
    }

    // Save all final data to MongoDB
    result.overallScore =
      finalEvaluated.overallScore || overallScoreSum;
    (result as any).strengths =
      finalEvaluated.strengths || [];
    (result as any).weaknesses =
      finalEvaluated.weaknesses || [];
    (result as any).recommendation =
      finalEvaluated.recommendation || "Consider";
    result.finalFeedback =
      finalEvaluated.finalFeedback || "";

    await result.save();

    // Mark the Interview document as completed
    await Interview.findOneAndUpdate(
      { roomId },
      { status: "completed", endedAt: new Date() }
    );

    console.log(
      `[BG-FINAL] ✅ Final evaluation saved silently for room: ${roomId}. Score: ${result.overallScore}. Status: ${result.resultstatus}`
    );
  } catch (error: any) {
    console.error(
      `[BG-FINAL] ❌ Final evaluation error:`,
      error.message
    );
  }
};
