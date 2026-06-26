import { Request,Response } from "express"
import { forgotPasswordServices, loginServices, regenAcessTokenservices, registerUser, resetpasswordservices } from "../services/user.services.ts"
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
   } catch (error:any) {
    return res.status(500).json({error:error.message})
   }
}

export const loginUserController = async(req:Request,res:Response)=>{
   try {
     const {email,password}=req.body
    if(!email){
        throw new Error("email is required")
    }
    if(!password){
        throw new Error("password is required")
    }
    const loginData= await loginServices(email,password)
    if(!loginData){
    return res.status(404).json({msg:"login not sucessfully"})
}
   
        res.cookie(
         "accesstoken",
         loginData.acesstoken,
         {
            httpOnly:true,
            secure:true,
            sameSite:"none"
         }
      )
      res.cookie("refreshtoken",loginData.refreshToken,{httpOnly:true,secure:true,sameSite:"none"})
        return res.status(200).json({msg:"login sucessfully",loginData})
   
   } catch (error:any) {
      return res.status(500).json({msg:"intenal server error",error:error.message})
   }

    
}

export const regenAcessTokenController =async (req:Request,res:Response)=>{
    try {
       const refreshToken = req.cookies.refreshtoken
       console.log(refreshToken)
       if(!refreshToken){
        return res.status(404).json({msg:"refreshtoken not found"})
       } 
       const data = await regenAcessTokenservices(refreshToken)
       if(!data){
        throw new Error("acesstoken not generated")
       }
       res.cookie(
         "accesstoken",
         data.acesstoken,
         {
            httpOnly:true,
            secure:false,
            sameSite:"lax"
         }
      )

      return res.status(200).json({
         success:true,
         accessToken:data.acesstoken
      })

    } catch (error:any) {
        return res.status(500).json({  success:false,
         msg:"Internal server error",
         error:error.message})
    }
}

export const forgotpasswordController = async(req:Request,res:Response)=>{
    try {
       const {email}=req.body
       if(!email){
        throw new Error("email is required")
       } 
       const forgotpassword = await forgotPasswordServices(email)
       return res.status(200).json({msg:"forgot password sucessfully",forgotpassword})
    } catch (error:any) {
        console.log(error)
        return res.status(500).json({msg:"internal server error",error:error.message})
    }
}

export const resetpassword = async(req:Request,res:Response)=>{
    try {
        const {otp,password}=req.body
        if(!otp){
            return res.status(404).json({msg:"otp is required"})
        }
        if(!password){
            return res.status(404).json({msg:"otp is required"}) 
        }
        const resetpass = await resetpasswordservices(otp,password)
        return res.status(200).json({msg:"password reset sucessfully",resetpass})
    } catch (error:any) {
        return res.status(500).json({msg:"internal server error",error:error.message})
    }
}
