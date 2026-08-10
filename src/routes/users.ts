import { Router } from "express";
import {
  createUser,
  getUsers,
  updateUser,
  getUserById,
  deleteUser,
} from "../controllers/users";
import { authenticate } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { createUserSchema, updateUserSchema } from "../validators/user";
import { upload } from "../middlewares/fileUpload";

const router = Router();

router.get("/", authenticate, getUsers);

router.post(
  "/",
  authenticate,
  upload.single("profile"),
  validate(createUserSchema),
  createUser,
);

router.patch(
  "/:id",
  authenticate,
  upload.single("profile"),
  validate(updateUserSchema),
  updateUser,
);

router.get("/:id", authenticate, getUserById);

router.delete("/:id", authenticate, deleteUser);

export default router;
