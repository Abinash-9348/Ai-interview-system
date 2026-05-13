import { Request,Response,NextFunction } from "express";
import jwt  from 'jsonwebtoken'
import { User } from "../model/users.model.ts";



interface JwtPayload {
   userid:string
   role:string
}
export const isValiduser = async(req:Request,res:Response,next:NextFunction) =>{
try {
    const token = req.cookies.accesstoken
    console.log(token)
 if(!token){
    return res.status(404).json({msg:"token not found"})
 }
 const decode =  jwt.verify(token,process.env.acess_secrate as string) as JwtPayload
 const user = await User.findById(decode.userid)
 if(!user){
   return res.status(404).json({msg:"user not found"})
 }
 (req as any).user = user;
 next()
} catch (error) {
   return res.status(401).json({
      msg: "Invalid token",
      error,
    }); 
}
}
