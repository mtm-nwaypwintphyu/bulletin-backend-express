import { Response, NextFunction } from "express";
import {
  create,
  getAll,
  getById,
  remove,
  update,
  importCsv,
  exportCsv,
  getImportHistories,
  removeImportHistory,
  getPostHistory,
  toggleReaction,
  getReactions,
} from "../services/posts";
import { AuthRequest } from "../middlewares/auth";
import { AppError } from "../utils/appError";
import { paginationSchema } from "../validators/post";
import { sendResponse } from "../utils/response";

const getPagination = (query: unknown) => {
  const result = paginationSchema.safeParse(query);
  if (!result.success) {
    throw new AppError("Invalid pagination parameters", 400);
  }
  return result.data;
};

// get posts
export const getPosts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const currentUser = req.user!;
    const pagination = getPagination(req.query);

    const result = await getAll(
      { id: currentUser.id, type: currentUser.type },
      pagination,
    );
    return sendResponse(res, 200, result);
  } catch (error) {
    next(error);
  }
};

// get post by id
export const getPostById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.params;
  try {
    const currentUser = req.user!;
    const post = await getById(Number(id), {
      id: currentUser.id,
      type: currentUser.type,
    });
    return sendResponse(res, 200, { post });
  } catch (error) {
    next(error);
  }
};

// create post
export const createPost = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const currentUser = req.user!;
    const result = await create(req.body, currentUser);
    return sendResponse(res, 201, { post: result });
  } catch (error) {
    next(error);
  }
};

// update post
export const updatePost = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;
    const result = await update(Number(id), req.body, currentUser);
    return sendResponse(res, 200, { post: result });
  } catch (error) {
    next(error);
  }
};

// delete post
export const deletePost = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const currentUser = req.user!;
    const { id } = req.params;

    await remove(Number(id), currentUser);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// post bulk insert
export const importPostCsv = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const currentUser = req.user!;

    const file = req.file;
    if (!file) {
      throw new AppError("Please upload a CSV file", 400);
    }

    const result = await importCsv(file.buffer, file.originalname, currentUser);

    return sendResponse(res, 200, result);
  } catch (error) {
    next(error);
  }
};

// post csv export
export const exportPostCsv = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const currentUser = req.user!;
    const csvString = await exportCsv(currentUser);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="posts_export.csv"',
    );

    return res.status(200).send(csvString);
  } catch (error) {
    next(error);
  }
};

// get post import histories
export const getImportHistoryList = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const pagination = getPagination(req.query);
    const currentUser = req.user!;

    const result = await getImportHistories(pagination, currentUser);
    return sendResponse(res, 200, result);
  } catch (error) {
    next(error);
  }
};

// delete post import history
export const deleteImportHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const currentUser = req.user!;

    const { id } = req.params;
    await removeImportHistory(Number(id), {
      id: currentUser.id,
      type: currentUser.type,
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// get post create history
export const getCreatedPostHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const pagination = getPagination(req.query);
    const currentUser = req.user!;

    const result = await getPostHistory(pagination, currentUser);
    return sendResponse(res, 200, result);
  } catch (error) {
    next(error);
  }
};

// toggle reaction
export const togglePostReaction = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    const result = await toggleReaction(Number(id), currentUser);
    return sendResponse(res, 200, result);
  } catch (error) {
    next(error);
  }
};

// get post reactions
export const getPostReactions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const result = await getReactions(Number(id));
    return sendResponse(res, 200, result);
  } catch (error) {
    next(error);
  }
};
