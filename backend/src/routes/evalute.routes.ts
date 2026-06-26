import express from "express"
import { isValiduser } from "../midileware/validator.ts"
import { evaluateInterview } from "../controllers/evalute.controller.ts"

export const evaluteAnswerRouter = express.Router()

evaluteAnswerRouter.post("/evaluate/:resultId",isValiduser,evaluateInterview)