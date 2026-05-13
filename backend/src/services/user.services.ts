import { User } from "../model/users.model.ts"
import bcrypt from 'bcryptjs'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { generateAcessToken, genrateRefreshToken } from "../utils/generateToken.ts";
import { sign } from "node:crypto";
import { sendEmail } from "../utils/transporter.ts";


export const registerUser = async(name:string,email:string,password:string)=>{
    const user = await User.findOne({email:email});
    if(user){
        throw new Error("Email already exist ");
    }
    const hashpasword = await bcrypt.hash(password,10);
    const createUser = await User.create({name,email,password:hashpasword});
    return createUser;
}

export const loginServices=async(email:string,password:string)=>{
    const isEmail = await User.findOne({email:email})
    if(!isEmail){
        throw new Error("invalid credential")
    }
    const isPassword = await bcrypt.compare(password,isEmail.password)
    if(!isPassword){
         throw new Error("invalid credential")
    }
    const acesstoken = await generateAcessToken(isEmail.id,isEmail.role)
    const refreshToken = await genrateRefreshToken(isEmail.id,isEmail.role)
    isEmail.refreshToken=refreshToken
    isEmail.save()
    return {
        acesstoken,refreshToken
    }
    
}

export const regenAcessTokenservices = async(refreshToken:string)=>{
    const decode = jwt.verify(refreshToken,process.env.refresh_secrate as string) as JwtPayload
    const user = await User.findById(decode.userid)
    if(!user){
        throw new Error("user not found")
    }
    if(refreshToken!=user.refreshToken){
        throw new Error("invlid refreshtoken")
    }
   const newAccessToken = generateAcessToken(
      user._id.toString(),
      user.role
   )
   return {
    acesstoken:newAccessToken
   }
}

export const forgotPasswordServices = async(
   email:string
)=>{

   const isEmail = await User.findOne({
      email
   })

   if(!isEmail){
      throw new Error("Email not found")
   }

   const otp = Math.floor(
      Math.random() * 90000
   ) + 10000

  isEmail.otpExpire = new Date(
   Date.now() + 5 * 60 * 1000
)

   isEmail.otp = otp.toString()
   isEmail.refreshToken=null

 

   await isEmail.save()



   await sendEmail(

      email,

      "Reset Password OTP",

      `Your OTP is ${otp}`

   )

   return otp

}

export const resetpasswordservices = async(otp:string,password:string)=>{
const isOtp = await User.findOne({
   otp,
})

if (!isOtp) {
   throw new Error("Invalid OTP")
}

if (!isOtp.otpExpire) {
   throw new Error("OTP expiry missing")
}

if (isOtp.otpExpire < new Date()) {
   throw new Error("Expired OTP")
}
const hashpassword =await bcrypt.hash(password,10)
isOtp.password=hashpassword
isOtp.otp=null,
isOtp.otpExpire=null
isOtp.save()
return {
          message: "Password reset successful"
}

}