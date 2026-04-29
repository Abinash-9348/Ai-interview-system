import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
  socketId: String,
  name: String,
  color: String
});