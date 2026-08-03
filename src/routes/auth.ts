import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  forgotPassword,
  resetPassword,
  changePassword,
} from "../controllers/auth";
import { validate } from "../middlewares/validate";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "../validators/auth";
import { forgotPasswordLimiter } from "../middlewares/rateLimiter";
import { authenticate } from "../middlewares/auth";

const router = Router();

router.post("/register", validate(registerSchema), registerUser);
router.post("/login", validate(loginSchema), loginUser);
router.post("/logout", logoutUser);
router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  validate(forgotPasswordSchema),
  forgotPassword,
);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);
router.post("/change-password", authenticate, validate(changePasswordSchema), changePassword);
export default router;
