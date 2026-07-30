import rateLimit from "express-rate-limit";

export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    status: "fail",
    message:
      "Too many password reset requests from this IP, please try again after an hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
