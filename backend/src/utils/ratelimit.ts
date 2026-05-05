import rateLimit from "express-rate-limit";
export const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // max 20 requests per minute
  message: "Too many requests, please try again later."
});