// ==========================================
// FILE: src/prompts/questionPrompt.ts
// ==========================================
// src/utils/prompt.ts
export const createQuestionPrompt = (jdText: string) => {
  return `
You are an expert technical interviewer.

Analyze the Job Description and generate interview questions.

IMPORTANT:
Return ONLY valid JSON.
Do not return markdown.
Do not return explanations.
Do not return notes.
Do not return code fences.
Do not return any text before or after the JSON.

Requirements:

1. Generate exactly 10 technical questions (placed in the "coding" array)
2. Generate exactly 3 scenario questions (placed in the "scenario" array)
3. Generate exactly 2 HR questions (placed in the "hr" array)

Rules:

- Questions must be medium difficulty
- Questions must be professional
- Questions must be based ONLY on technologies explicitly mentioned in the JD
- Do NOT ask DSA (Data Structures and Algorithms) questions
- Do NOT ask aptitude questions
- Do NOT ask coding implementation questions that require writing code or writing software syntax
- Do NOT generate duplicate or highly similar questions

Return exactly in this format:

{
  "coding": [
    "technical question 1",
    "technical question 2",
    "technical question 3",
    "technical question 4",
    "technical question 5",
    "technical question 6",
    "technical question 7",
    "technical question 8",
    "technical question 9",
    "technical question 10"
  ],
  "scenario": [
    "scenario question 1",
    "scenario question 2",
    "scenario question 3"
  ],
  "hr": [
    "hr question 1",
    "hr question 2"
  ]
}

Job Description:
${jdText}
`;
};

export const evaluatePrompt = (
  question: string,
  answer: string
) => `
You are an expert technical interviewer.

Question:
${question}

Candidate Answer:
${answer}

Evaluate the answer strictly but fairly based on the question.

Return ONLY a valid JSON. Do not include markdown wraps or code blocks.

{
  "technicalScore": 0,
  "communicationScore": 0,
  "confidenceScore": 0,
  "accuracyScore": 0,
  "clarityScore": 0,
  "feedback": "Explain clearly why each score was given, highlighting points of strength or error.",
  "correctAnswer": "Generate an ideal, comprehensive, professional answer for the question."
}

Rules:
- All scores (technicalScore, communicationScore, confidenceScore, accuracyScore, clarityScore) must be integers from 0 to 10.
- feedback: max 50 words explaining the scoring.
- correctAnswer: A perfect professional response to the question.
- Return valid JSON only.
- No markdown, no explanation, no code block, no text outside JSON.
`;

export const createFinalEvaluationPrompt = (
  answersListJson: string,
  cheatingMetrics: string
) => `
You are a senior recruiter and technical director.
Analyze the complete interview performance for a candidate including their answers, scores, and proctoring metrics.

Candidate Answers and Scores:
${answersListJson}

Anti-Cheating / Proctoring Metrics:
${cheatingMetrics}

Perform a final evaluation. Calculate the final aggregated score and determine their hiring suitability.

Return ONLY a valid JSON. Do not include markdown wraps or code blocks.

{
  "overallScore": 0,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "recommendation": "Strong Hire / Hire / Consider / Reject",
  "finalFeedback": "Detailed, professional summary of the candidate's performance, technical fit, and communication capability."
}

Rules:
- overallScore: Calculate the total sum of all individual dimension scores (technical, communication, confidence, accuracy, clarity) from all answers.
- recommendation: Must be exactly one of: "Strong Hire", "Hire", "Consider", "Reject".
- strengths: Provide exactly 3 to 5 realistic professional strengths based on their answers.
- weaknesses: Provide exactly 2 to 4 realistic constructive feedback points.
- Return valid JSON only.
- No markdown, no explanation, no code block, no text outside JSON.
`;