import { Router } from "express";
import {
  createPost,
  deletePost,
  getPostById,
  getPosts,
  updatePost,
  postCsvImport,
  postCsvExport,
  getImportHistoryList,
  deleteImportHistory,
  getCreatedPostHistory,
  togglePostReaction,
  getPostReactions,
} from "../controllers/posts";
import { validate } from "../middlewares/validate";
import { createPostSchema, updatePostSchema } from "../validators/post";
import { authenticate } from "../middlewares/auth";
import { uploadCsv } from "../middlewares/fileUpload";

const router = Router();

// post crud
router.post("/", authenticate, validate(createPostSchema), createPost);
router.get("/", authenticate, getPosts);

// csv import, export
router.post("/import", authenticate, uploadCsv.single("posts"), postCsvImport);
router.get("/export", authenticate, postCsvExport);

// histories
router.get("/import-histories", authenticate, getImportHistoryList);
router.delete("/import-histories/:id", authenticate, deleteImportHistory);
router.get("/post-histories", authenticate, getCreatedPostHistory);

// dynamic routes
router.get("/:id", authenticate, getPostById);
router.patch("/:id", authenticate, validate(updatePostSchema), updatePost);
router.delete("/:id", authenticate, deletePost);
router.post("/:id/react", authenticate, togglePostReaction);
router.get("/:id/react", authenticate, getPostReactions);

export default router;
