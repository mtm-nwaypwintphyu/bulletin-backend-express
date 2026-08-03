import { Request, Response, NextFunction } from "express";
import { register, login, forgot, reset, change } from "../services/auth";
import { AuthRequest } from "../middlewares/auth";

export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const newUser = await register(req.body);

    return res.status(201).json({
      status: "success",
      message: "User registered successfully.",
      data: newUser,
    });
  } catch (error: any) {
    next(error);
  }
};

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user, token, rememberMe } = await login(req.body);

    const cookieExpiry = rememberMe
      ? 30 * 24 * 60 * 60 * 1000
      : 1 * 24 * 60 * 60 * 1000;

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.ENV === "production",
      maxAge: cookieExpiry,
    });

    return res
      .status(200)
      .json({ status: "success", data: { user, rememberMe } });
  } catch (error: any) {
    next(error);
  }
};

// synchronous, try/catch no need
export const logoutUser = (req: Request, res: Response, next: NextFunction) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.ENV === "production",
    sameSite: "lax",
  });

  return res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
};

// forgot
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email } = await forgot({ email: req.body.email });

    return res.status(200).json({
      status: "success",
      message: "Password reset link has been sent to your email successfully.",
      data: { email },
    });
  } catch (error) {
    next(error);
  }
};

// reset
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.query.token as string;
    const { password } = req.body;

    if (!token) {
      return res
        .status(400)
        .json({ status: "fail", message: "Token is required." });
    }

    await reset(token, { password });
    return res.status(200).json({
      status: "success",
      message:
        "Your password has been reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    next(error);
  }
};

// change password
export const changePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    await change(userId!, req.body);

    return res.status(200).json({
      status: "success",
      message: "Password changed successfully",
    });
  } catch (error) {
    next(error);
  }
}
