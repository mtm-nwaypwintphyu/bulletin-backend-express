import { Router } from "express";
import { authenticate } from "../middlewares/auth";

const router = Router();

router.get("/", authenticate, (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Access granted to profile",
  });
});

export default router;
