import { Response, NextFunction } from "express";
import { create, getAll, getById, remove, update } from "../services/users";
import { AuthRequest } from "../middlewares/auth";
import { AppError } from "../utils/appError";
import { paginationSchema } from "../validators/user";
import { sendResponse } from "../utils/response";
import { uploadToS3 } from "../utils/s3Upload";

// get user
export const getUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const currentUser = req.user;

    if (!currentUser) {
      throw new AppError("Unauthorized", 401);
    }

    const pagination = paginationSchema.parse(req.query);

    const result = await getAll(
      { id: currentUser.id, type: currentUser.type },
      pagination,
    );

    return sendResponse(res, 200, {
      users: result.users,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// create user
export const createUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const currentUser = req.user;

    if (!currentUser) {
      throw new AppError("Unauthorized", 401);
    }

    const data = {
      ...req.body,
    };

    const result = await create(data, req.file, {
      id: currentUser.id,
      type: currentUser.type,
    });

    return sendResponse(res, 201, { user: result });
  } catch (error) {
    next(error);
  }
};

// update user
export const updateUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    if (!currentUser) {
      throw new AppError("Unauthorized", 401);
    }

    let profileUrl = req.body.profile || null;

    if (req.file) {
      profileUrl = await uploadToS3(req.file);
    }

    const data = {
      ...req.body,
      profile: profileUrl,
    };

    const result = await update(Number(id), data, currentUser);
    return sendResponse(res, 200, { user: result });
  } catch (error) {
    next(error);
  }
};

// get user by id
export const getUserById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    if (!currentUser) {
      throw new AppError("Unauthorized", 401);
    }

    const result = await getById(Number(id), currentUser);

    return sendResponse(res, 200, { user: result });
  } catch (error) {
    next(error);
  }
};

// delete
export const deleteUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const currentUser = req.user;
    const { id } = req.params;

    if (!currentUser) {
      throw new AppError("Unauthorized", 401);
    }

    const result = await remove(Number(id), {
      id: currentUser.id,
      type: currentUser.type,
    });

    return sendResponse(res, 200, result);
  } catch (error) {
    next(error);
  }
};
