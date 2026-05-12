import express from 'express'
import { register } from 'node:module'
import { registerUserontroller } from '../controllers/user.controller.ts'

export const userRouter = express.Router()

userRouter.post("/create",registerUserontroller)