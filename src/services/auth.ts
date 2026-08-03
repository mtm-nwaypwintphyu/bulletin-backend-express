import prisma from "../config/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { UserDto } from "../dto/user";
import { AppError } from "../utils/appError";
import { UserType } from "@prisma/client";
import { transporter } from "../config/mailer";
import {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
} from "../validators/auth";

export const renderForgotPasswordEmail = (resetUrl: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Password Reset Request</title>
    </head>
    <body>
      <h2>Password Reset Request</h2>
      <p>You requested a password reset. Please click the link below to set a new password:</p>
      <p><a href="${resetUrl}" target="_blank">Reset Password</a></p>
      <p>If you did not request this, please ignore this email.</p>
    </body>
    </html>
      `.trim();
};

// register
export const register = async (data: RegisterInput) => {
  const { name, email, password, phone, address, dob, profile } = data;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError("Email already exists", 400);
  }

  const existingName = await prisma.user.findUnique({
    where: { name },
  });

  if (existingName) {
    throw new AppError("Name already exists", 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      profile,
      phone,
      address,
      dob: dob ? new Date(dob) : null,
      createUserId: 0,
      updatedUserId: 0,
      type: UserType.USER,
    },
  });
  return UserDto.plainToInstance(newUser);
};

// login
export const login = async (data: LoginInput) => {
  const { email, password, rememberMe } = data;

  const user = await prisma.user.findFirst({
    where: {
      email,
      deletedAt: null,
    },
  });
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);

  if (!isPasswordCorrect) {
    throw new AppError("Invalid email or password", 401);
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new AppError("Jwt secret is not configured", 500);
  }

  const token = jwt.sign({ id: user.id, type: user.type }, jwtSecret, {
    expiresIn: rememberMe ? "30d" : "1d",
  });

  const userDto = UserDto.plainToInstance(user);

  return { user: userDto, token, rememberMe };
};

// forgot password
export const forgot = async (data: ForgotPasswordInput) => {
  const { email } = data;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return { email };
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new AppError("JWT_SECRET is not configured", 500);
  }

  const dynamicSecret = jwtSecret + user.password;
  const resetToken = jwt.sign(
    { id: user.id, email: user.email },
    dynamicSecret,
    {
      expiresIn: "10m",
    },
  );

  await prisma.passwordReset.deleteMany({ where: { email } });

  await prisma.passwordReset.create({
    data: {
      email,
      token: resetToken,
    },
  });

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const resetUrl = `${frontendUrl}/user/reset-password?token=${resetToken}`;

  const htmlContent = renderForgotPasswordEmail(resetUrl);
  if (process.env.ENV === "development") {
    console.log("Password Reset Link for Testing ->", resetUrl);
  }

  const mailerOptions = {
    from: '"Bulletin Board" <no-reply@yourapp.com>',
    to: email,
    subject: "Password Reset Request",
    html: htmlContent,
  };

  await transporter.sendMail(mailerOptions);

  return { email };
};

// reset
export const reset = async (token: string, data: ResetPasswordInput) => {
  const { password } = data;

  const record = await prisma.passwordReset.findFirst({ where: { token } });

  if (!record) {
    throw new AppError("Invalid or expired password reset token.", 400);
  }

  const user = await prisma.user.findUnique({
    where: { email: record.email },
  });

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new AppError("JWT_SECRET is not configured", 500);
  }

  const dynamicSecret = jwtSecret + user.password;

  try {
    jwt.verify(token, dynamicSecret);
  } catch (error) {
    throw new AppError("Invalid or expired password reset token.", 400);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { email: record.email },
    data: { password: hashedPassword },
  });

  await prisma.passwordReset.deleteMany({
    where: { email: record.email },
  });

  return { email: record.email };
};

// change password
export const change = async (userId: number, data: ChangePasswordInput) => {
  const { currentPassword, newPassword } = data;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError("User not found.", 404);
  }

  const isCurrentPasswordCorrect = await bcrypt.compare(
    currentPassword,
    user.password,
  );

  if (!isCurrentPasswordCorrect) {
    throw new AppError("Current password is incorrect", 401);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return { message: "Password changed successfully" };
};
