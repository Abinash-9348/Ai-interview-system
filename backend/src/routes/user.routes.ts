import express from 'express'
import { register } from 'node:module'
import { forgotpasswordController, loginUserController, regenAcessTokenController, registerUserontroller, resetpassword } from '../controllers/user.controller.ts'

export const userRouter = express.Router()

userRouter.post("/create",registerUserontroller)
userRouter.post("/login",loginUserController)
userRouter.post("/regenacesoken",regenAcessTokenController)
userRouter.post("/forgotpassword",forgotpasswordController)
userRouter.post("/resetpasssword",resetpassword)