import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()

export const db_connect = async()=>{
    try {
       await mongoose.connect(process.env.DB_URL as string)
       console.log("Db connected sucessfully")
    } catch (error) {
          console.error("MongoDB connection error", error);
    }
}