import prisma from "../config/prisma";
import bcrypt from "bcrypt";
import { UserDto } from "../dto/user";
import { AppError } from "../utils/appError";
import { UserType } from "@prisma/client";
import {
  CreateUserInput,
  UpdateUserInput,
  PaginationInput,
} from "../validators/user";

// get all users
export const getAll = async (
  currentUser: { id: number; type: UserType },
  pagination: PaginationInput,
) => {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const where = {
    deletedAt: null,
    ...(currentUser.type !== UserType.ADMIN && {
      createUserId: currentUser.id,
    }),
  };

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users: users.map((user) => UserDto.plainToInstance(user)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// create user
export const create = async (
  data: CreateUserInput,
  currentUser: { id: number; type: UserType },
) => {
  const { name, email, password, profile, phone, address, dob, type } = data;

  const targetType = type || UserType.USER;

  if (currentUser.type !== UserType.ADMIN && targetType !== UserType.USER) {
    throw new AppError("Unauthorized to create this type of user", 403);
  }

  const existingEmail = await prisma.user.findUnique({ where: { email } });

  if (existingEmail) {
    throw new AppError("Email already exists", 400);
  }

  const existingName = await prisma.user.findFirst({ where: { name } });

  if (existingName) {
    throw new AppError("Name already exists", 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      profile: profile || null,
      phone: phone || null,
      address: address || null,
      dob: dob ? new Date(dob) : null,
      type: targetType,
      createUserId: currentUser.id,
      updatedUserId: currentUser.id,
    },
  });

  return UserDto.plainToInstance(newUser);
};

// update user
export const update = async (
  id: number,
  data: UpdateUserInput,
  currentUser: { id: number; type: UserType },
) => {
  const existingUser = await prisma.user.findUnique({
    where: { id, deletedAt: null },
  });

  if (!existingUser) {
    throw new AppError("User not found", 404);
  }

  if (
    currentUser.type !== UserType.ADMIN &&
    existingUser.createUserId !== currentUser.id &&
    existingUser.id !== currentUser.id
  ) {
    throw new AppError("Unauthorized to update this user", 403);
  }

  let targetType = existingUser.type;

  if (data.type !== undefined && data.type !== existingUser.type) {
    if (currentUser.type !== UserType.ADMIN) {
      throw new AppError("Unauthorized to change user type", 403);
    }
    targetType = data.type;
  }

  if (data.name && data.name !== existingUser.name) {
    const existingName = await prisma.user.findFirst({
      where: {
        name: data.name,
        NOT: { id },
      },
    });

    if (existingName) {
      throw new AppError("Name already exists", 400);
    }
  }

  let formattedDob = existingUser.dob;
  if (data.dob !== undefined) {
    formattedDob = data.dob ? new Date(data.dob) : null;
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.profile !== undefined && { profile: data.profile || null }),
      ...(data.phone !== undefined && { phone: data.phone || null }),
      ...(data.address !== undefined && { address: data.address || null }),
      ...(data.dob !== undefined && { dob: formattedDob }),
      type: targetType,
      updatedUserId: currentUser.id,
    },
  });

  return UserDto.plainToInstance(updatedUser);
};

// get user by id
export const getById = async (
  id: number,
  currentUser: { id: number; type: UserType },
) => {
  const where = {
    id,
    deletedAt: null,
    ...(currentUser.type !== UserType.ADMIN && {
      createUserId: currentUser.id,
    }),
  };

  const user = await prisma.user.findFirst({ where });
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return UserDto.plainToInstance(user);
};

// delete
export const remove = async (
  id: number,
  currentUser: { id: number; type: UserType },
) => {
  const where = {
    id,
    deletedAt: null,
    ...(currentUser.type !== UserType.ADMIN && {
      createUserId: currentUser.id,
    }),
  };

  const existingUser = await prisma.user.findFirst({ where });

  if (!existingUser) {
    throw new AppError("User not found or unauthorized to delete", 404);
  }

  await prisma.user.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      deletedUserId: currentUser.id,
    },
  });
  return { message: "User deleted successfully" };
};
