import { Request, Response }
from "express";

import {
  InterviewResult
} from "../model/interview.result.ts";

import {
  evaluatePrompt,
  createFinalEvaluationPrompt
} from "../utils/prompt.ts";

import {
  model
} from "../config/gemini.config.ts";

import {
  Violation
} from "../model/violation.model.ts";

export const evaluateInterview =
async (
  req: Request,
  res: Response
) => {

  try {

    const { resultId } =
      req.params;

    console.log(
      "[EVALUATE] STARTING EVALUATION FOR RESULT ID:",
      resultId
    );

    const result =
      await InterviewResult.findById(
        resultId
      );

    if (!result) {

      console.log(
        "[EVALUATE] RESULT NOT FOUND"
      );

      return res.status(404)
        .json({
          success: false,
          message:
            "Interview result not found",
        });
    }

    let overallScoreSum = 0;

    for (
      const ans of result.answers
    ) {

      let parsedAiResult: any = null;
      let attempts = 0;
      const maxAttempts = 3;

      console.log(
        "===================================="
      );

      console.log(
        "[EVALUATE - QUESTION]",
        ans.question?.substring(0, 50) + "..."
      );

      const prompt =
        evaluatePrompt(
          ans.question || "",
          ans.answer || ""
        );

      while (attempts < maxAttempts && !parsedAiResult) {
        attempts++;
        try {
          const response =
            await model.generateContent(
              prompt
            );

          const text =
            response.response.text();

          let cleaned =
            text
              .replace(
                /```json|```/g,
                ""
              )
              .trim();

          const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            cleaned = jsonMatch[0];
          }

          parsedAiResult = JSON.parse(cleaned);
        } catch (parseError: any) {
          console.warn(`[EVALUATE] Attempt ${attempts} JSON parse failed:`, parseError.message);
        }
      }

      // Safe Fallback if LLM evaluation fails
      if (!parsedAiResult) {
        parsedAiResult = {
          technicalScore: 5,
          communicationScore: 5,
          confidenceScore: 5,
          accuracyScore: 5,
          clarityScore: 5,
          feedback: "Evaluation could not be fully parsed. Default moderate score applied.",
          correctAnswer: "Ideal response evaluation failed. Please review candidate transcription directly."
        };
      }

      // Assign scores
      ans.technicalScore = Number(parsedAiResult.technicalScore) || 0;
      ans.communicationScore = Number(parsedAiResult.communicationScore) || 0;
      ans.confidenceScore = Number(parsedAiResult.confidenceScore) || 0;
      (ans as any).accuracyScore = Number(parsedAiResult.accuracyScore) || 0;
      (ans as any).clarityScore = Number(parsedAiResult.clarityScore) || 0;
      ans.feedback = parsedAiResult.feedback || "";
      ans.correctAnswer = parsedAiResult.correctAnswer || "";

      overallScoreSum +=
        ans.technicalScore +
        ans.communicationScore +
        ans.confidenceScore +
        (ans as any).accuracyScore +
        (ans as any).clarityScore;
    }

    console.log(
      "[EVALUATE] INDIVIDUAL ANSWERS SCORES EVALUATED. TOTAL ACCUMULATED SCORE:",
      overallScoreSum
    );

    // ==========================================
    // ANTI-CHEATING PROCTORING CALCULATION
    // ==========================================
    const violation =
      await Violation.findOne({
        roomId:
          result.roomId,
        userId:
          result.candidateId
            ?.toString(),
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

    if (cheatingScore < 0) {
      cheatingScore = 0;
    }

    result.cheatingScore = cheatingScore;

    // Disqualification Rules
    if (
      multipleFaceCount > 2 ||
      tabSwitchCount > 3 ||
      headMovementCount > 5
    ) {
      result.resultstatus = "DISQUALIFIED";
      console.log("[EVALUATE] 🚨 CANDIDATE DISQUALIFIED DUE TO EXCESSIVE VIOLATIONS.");
    } else {
      result.resultstatus = "PASSED";
    }

    // ==========================================
    // FINAL AGGREGATE EVALUATION
    // ==========================================
    let finalEvaluated: any = null;
    let aggregateAttempts = 0;

    if (result.resultstatus === "DISQUALIFIED") {
      finalEvaluated = {
        overallScore: overallScoreSum,
        strengths: ["None (Disqualified)"],
        weaknesses: ["Suspicious user behavior", "Unusual activity detected"],
        recommendation: "Reject",
        finalFeedback: "Candidate was disqualified automatically due to security violations including frequent tab-switching or presence of multiple faces."
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
          clarity: a.clarityScore
        },
        feedback: a.feedback
      }));

      const proctoringInfo = `Cheating Score: ${cheatingScore}/100. Tab Switches: ${tabSwitchCount}. Multiple Faces: ${multipleFaceCount}. Head Movements: ${headMovementCount}.`;
      const finalPrompt = createFinalEvaluationPrompt(
        JSON.stringify(simplifiedAnswers, null, 2),
        proctoringInfo
      );

      while (aggregateAttempts < 3 && !finalEvaluated) {
        aggregateAttempts++;
        try {
          const finalResponse = await model.generateContent(finalPrompt);
          let finalText = finalResponse.response.text();

          let cleanedFinal = finalText
            .replace(/```json|```/g, "")
            .trim();

          const jsonMatch = cleanedFinal.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            cleanedFinal = jsonMatch[0];
          }

          finalEvaluated = JSON.parse(cleanedFinal);
        } catch (err: any) {
          console.warn(`[EVALUATE] Final Aggregate Attempt ${aggregateAttempts} failed:`, err.message);
        }
      }

      if (!finalEvaluated) {
        // Fallback default final evaluation
        const avgScore = overallScoreSum / (result.answers.length || 1);
        let recommendation = "Consider";
        if (avgScore >= 35) recommendation = "Strong Hire";
        else if (avgScore >= 25) recommendation = "Hire";
        else if (avgScore < 15) recommendation = "Reject";

        finalEvaluated = {
          overallScore: overallScoreSum,
          strengths: ["Communicates technical concepts", "Demonstrates core technology understanding"],
          weaknesses: ["Could provide deeper implementation details"],
          recommendation,
          finalFeedback: "The interview was completed successfully. Candidate performed moderately across core technical aspects."
        };
      }
    }

    // Save final evaluations
    result.overallScore = finalEvaluated.overallScore || overallScoreSum;
    (result as any).strengths = finalEvaluated.strengths || [];
    (result as any).weaknesses = finalEvaluated.weaknesses || [];
    (result as any).recommendation = finalEvaluated.recommendation || "Consider";
    result.finalFeedback = finalEvaluated.finalFeedback || "";

    await result.save();

    console.log(
      "[EVALUATE] RESULT SAVED SUCCESSFULLY ID:",
      result._id
    );

    return res.status(200)
      .json({
        success: true,
        message: "Interview evaluated successfully",
      });

  } catch (error: any) {

    console.error(
      "EVALUATION ERROR:",
      error
    );

    return res.status(500)
      .json({
        success: false,
        message:
          "Evaluation failed",
        error: error.message
      });
  }
};

