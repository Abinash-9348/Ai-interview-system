import { Request,Response } from "express"
import { registerUser } from "../services/user.services.ts"
export const registerUserontroller = async(req:Request,res:Response)=>{
   try {
     const {name,email,password}=req.body
    if(!name){
        return res.status(404).json({msg:"name is required"})
    }
      if(!email){
        return res.status(404).json({msg:"email is required"})
    }
      if(!password){
        return res.status(404).json({msg:"password is required"})
    }
    const userData = await registerUser(name,email,password)
    if(!userData){
        return res.status(404).json({msg:"user not created"})
    }
    return res.status(200).json({msg:"user created sucessfully",userData})
   } catch (error) {
    return res.status(500).json(error as any)
   }
}