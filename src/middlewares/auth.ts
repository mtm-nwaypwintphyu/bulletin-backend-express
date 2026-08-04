import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import { AppError } from "../utils/appError";
import { UserType } from "@prisma/client";

export interface AuthRequest extends Request {
  user?: {
    id: number;
    type: UserType;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    let token = req.cookies.token;

    if (
      !token &&
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      throw new AppError("You are not logged in. Please login first.", 401);
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) throw new AppError("JWT_SECRET is not configured", 500);

    const decoded = jwt.verify(token, jwtSecret) as { id: number, type: UserType}

    req.user = decoded;

    next();
  } catch (error: any) {
    if (error.name === "JsonWebTokenError")
      return next(new AppError("Invalid token. Please login again.", 401));
    if (error.name === "TokenExpiredError")
      return next(
        new AppError("Your token has expired. Please login again.", 401),
      );

    next(error);
  }
};
