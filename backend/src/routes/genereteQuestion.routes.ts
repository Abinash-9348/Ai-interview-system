import express from "express"
import { generateQuestionController } from "../controllers/question.generate.controller.ts"
import { isValiduser } from "../midileware/validator.ts"

export const generateQuestionRouter = express.Router()

generateQuestionRouter.post("/askquestion/:jdid",isValiduser,generateQuestionController)