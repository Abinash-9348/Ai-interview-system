import mongoose from "mongoose";
const userSchema = new mongoose.Schema({

  name:{
    type:String,
    required:true
  },

  email:{
    type:String,
    required:true,
    unique:true,
       validate:{
      validator:function(v:string){
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
      },

      message:"Invalid email format"
    }
  },

  password:{
    type:String,
    required:true,
    minlength:[4,"Password must be at least 4 characters"]
  },

  role:{
    type:String,
    enum:["candidate","recruiter"],
    default:"candidate"
  },
  refreshToken:{type:String  ,default:null},
  otp:{type:String,default:null},
otpExpire: {
   type: Date,
   default:null
}

},{timestamps:true})

export const User = mongoose.model("User",userSchema)