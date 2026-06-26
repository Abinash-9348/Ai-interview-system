import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../model/users.model.ts";
import { AuthRequest } from "../types/express.ts";

interface JwtPayload {
  id: string;
  role: string;
  name: string;
}

export const isValiduser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
     console.log("COOKIES =", req.cookies);
  console.log("HEADER =", req.headers.cookie);
    const token = req.cookies.accesstoken;

    if (!token) {
      return res.status(401).json({
        msg: "token not found",
      });
    }

    const decode = jwt.verify(
      token,
      process.env.ACCESS_SECRET as string
    ) as JwtPayload;

    const user = await User.findById(decode.id);

    if (!user) {
      return res.status(404).json({
        msg: "user not found",
      });
    }

    req.user = {
      id: user._id.toString(),
      role: user.role,
      name: user.name,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      msg: "Invalid token",
      error,
    });
  }
};
