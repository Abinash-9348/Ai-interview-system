import express from "express"
import { generateQuestionController } from "../controllers/question.generate.controller.ts"

export const generateQuestionRouter = express.Router()

generateQuestionRouter.post("/askquestion/:jdid",generateQuestionController)