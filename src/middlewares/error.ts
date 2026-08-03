import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/appError";

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error("ERROR :", err);

  const statusCode = "statusCode" in err ? err.statusCode : 500;
  const message = err.message || "Server error!";

  res.status(statusCode).json({
    status: "error",
    message,
    stack: process.env.ENV === "development" ? err.stack : undefined,
  });
};
