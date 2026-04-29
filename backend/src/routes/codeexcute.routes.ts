import express from 'express'
import { executeCodeController } from '../controllers/excute.room.controller.ts'

export const codeexecuteRouter=express.Router()

codeexecuteRouter.post("/run",executeCodeController)