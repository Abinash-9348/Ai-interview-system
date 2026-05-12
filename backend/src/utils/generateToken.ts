import jwt from 'jsonwebtoken'
import dotenv from "dotenv"
dotenv.config()

export const generateAcessToken =(userid:string,role:string)=>{
return jwt.sign({userid,role},process.env.acess_secrate as string,{expiresIn:"15m"})
}

export const genrateRefreshToken =(userid:string,role:string)=>{
    return jwt.sign({userid,role},process.env.refresh_secrate as string,{expiresIn:"15d"})
}