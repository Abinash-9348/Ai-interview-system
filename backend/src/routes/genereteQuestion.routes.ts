import express from "express"
import { generateQuestionController, getInterviewResult } from "../controllers/question.generate.controller.ts"
import { isValiduser } from "../midileware/validator.ts"

export const generateQuestionRouter = express.Router()

generateQuestionRouter.post("/askquestion/:jdid",isValiduser,generateQuestionController)

generateQuestionRouter.get("/getanswer/:roomId", getInterviewResult)

