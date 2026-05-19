import { Request } from "express";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    name: string;
    [key: string]: any;
  };
}
