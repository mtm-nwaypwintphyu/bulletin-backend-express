import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth";
import { AppError } from "../utils/appError";
import { UserType } from "@prisma/client";

export const authorize = (...allowRoles: UserType[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("User not authenticated", 401));
    }

    if (!allowRoles.includes(req.user.type as UserType)) {
      return next(
        new AppError("You do not have permission to perform this action", 403),
      );
    }
    next();
  };
};
