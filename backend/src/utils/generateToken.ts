import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const generateAcessToken = (id: string, role: string,name:string) => {
  return jwt.sign(
    { id, role ,name},
    process.env.ACCESS_SECRET as string,
    { expiresIn: "15m" }
  );
};

export const genrateRefreshToken = (id: string, role: string,name:string) => {
  return jwt.sign(
    { id, role,name },
    process.env.REFRESH_SECRET as string,
    { expiresIn: "15d" }
  );
};