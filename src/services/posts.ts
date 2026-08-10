import prisma from "../config/prisma";
import { PostDto } from "../dto/post";
import {
  CreatePostInput,
  ImportPostInput,
  PaginationInput,
  UpdatePostInput,
  importPostSchema,
} from "../validators/post";
import { AppError } from "../utils/appError";
import { UserType, PostStatus, Prisma } from "@prisma/client";
import { parseCsvBuffer } from "../utils/csvHelper";

// csv row data
interface CsvRowData {
  title: string;
  description: string;
}

// get all posts
export const getAll = async (
  currentUser: { id: number; type: UserType },
  pagination: PaginationInput,
) => {
  const { page, limit, search } = pagination;
  const skip = (page - 1) * limit;

  const where = {
    deletedAt: null,
    ...(currentUser.type !== UserType.ADMIN && {
      createUserId: currentUser.id,
    }),
    ...(search && {
      OR: [
        { title: { contains: search } },
        { description: { contains: search } },
      ],
    }),
  };

  const [posts, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        createUser: { select: { name: true } },
        updatedUser: { select: { name: true } },
      },
    }),
    prisma.post.count({ where }),
  ]);

  return {
    posts: posts.map((post) => PostDto.plainToInstance(post)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// get post by id
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

  const post = await prisma.post.findFirst({
    where,
    include: {
      createUser: { select: { name: true } },
      updatedUser: { select: { name: true } },
      deletedUser: { select: { name: true } },
    },
  });
  if (!post) {
    throw new AppError("Post not found", 404);
  }
  return PostDto.plainToInstance(post);
};

// create post
export const create = async (
  data: CreatePostInput,
  currentUser: { id: number; type: UserType },
) => {
  const { title, description, status } = data;

  const existingTitle = await prisma.post.findUnique({
    where: { title },
  });

  if (existingTitle) {
    throw new AppError("Post title already exists", 400);
  }

  const newPost = await prisma.post.create({
    data: {
      title,
      description,
      status,
      createUserId: currentUser.id,
      updatedUserId: currentUser.id,
    },
    include: {
      createUser: { select: { name: true } },
      updatedUser: { select: { name: true } },
    },
  });

  return PostDto.plainToInstance(newPost);
};

// update post
export const update = async (
  id: number,
  data: UpdatePostInput,
  currentUser: { id: number; type: UserType },
) => {
  const where = {
    id,
    deletedAt: null,
    ...(currentUser.type !== UserType.ADMIN && {
      createUserId: currentUser.id,
    }),
  };

  const existingPost = await prisma.post.findFirst({ where });

  if (!existingPost) {
    throw new AppError("Post not found or unauthorized to edit", 404);
  }

  if (data.title && data.title !== existingPost.title) {
    const titleExists = await prisma.post.findFirst({
      where: { title: data.title },
    });

    if (titleExists) {
      throw new AppError("Post title already exists", 400);
    }
  }

  const updatePost = await prisma.post.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && {
        description: data.description,
      }),
      ...(data.status !== undefined && { status: data.status }),
      updatedUserId: currentUser.id,
    },
    include: {
      createUser: { select: { name: true } },
      updatedUser: { select: { name: true } },
    },
  });
  return PostDto.plainToInstance(updatePost);
};

// delete post
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

  const existingPost = await prisma.post.findFirst({ where });
  if (!existingPost) {
    throw new AppError("Post not found or unauthorized to delete", 404);
  }

  await prisma.post.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      deletedUserId: currentUser.id,
    },
  });
  return { message: "Post deleted successfully" };
};

// csv import
export const importCsv = async (
  fileBuffer: Buffer,
  fileName: string,
  currentUser: { id: number; type: UserType },
): Promise<{
  count: number;
  skipped: number;
  errors: { row: number; message: string }[];
}> => {
  const records = await parseCsvBuffer<Record<string, string>>(fileBuffer);

  if (!records || records.length === 0) {
    throw new AppError("The CSV file is empty", 400);
  }

  const MAX_ROWS = 1000;
  if (records.length > MAX_ROWS) {
    throw new AppError(`CSV file exceeds the maximum of ${MAX_ROWS} rows`, 400);
  }

  const errors: { row: number; message: string }[] = [];
  const candidates: { row: number; data: ImportPostInput }[] = [];
  const seenTitles = new Set<string>();

  records.forEach((row, index) => {
    const rowNumber = index + 2;
    const parsed = importPostSchema.safeParse({
      title: row.title ?? row.Title,
      description: row.description ?? row.Description,
      status: row.status ?? row.Status,
    });

    if (!parsed.success) {
      errors.push({
        row: rowNumber,
        message: parsed.error.issues.map((issue) => issue.message).join(", "),
      });
      return;
    }

    const titleKey = parsed.data.title.toLowerCase();
    if (seenTitles.has(titleKey)) {
      errors.push({ row: rowNumber, message: "Duplicate title within the file" });
      return;
    }
    seenTitles.add(titleKey);
    candidates.push({ row: rowNumber, data: parsed.data });
  });

  const existingPosts = await prisma.post.findMany({
    where: { title: { in: candidates.map((c) => c.data.title) } },
    select: { title: true },
  });
  const existingTitles = new Set(
    existingPosts.map((post) => post.title.toLowerCase()),
  );

  const toCreate = candidates.filter((c) => {
    if (existingTitles.has(c.data.title.toLowerCase())) {
      errors.push({
        row: c.row,
        message: "Post title already exists in the database",
      });
      return false;
    }
    return true;
  });

  const status = errors.length > 0 ? "PARTIAL" : "SUCCESS";

  const history = prisma.importHistory.create({
    data: {
      filename: fileName,
      totalImported: toCreate.length,
      status,
      createUserId: currentUser.id,
    },
  });

  const operations: Prisma.PrismaPromise<unknown>[] = [];
  if (toCreate.length > 0) {
    operations.push(
      prisma.post.createMany({
        data: toCreate.map((c) => ({
          title: c.data.title,
          description: c.data.description,
          status: c.data.status ?? PostStatus.ACTIVE,
          createUserId: currentUser.id,
          updatedUserId: currentUser.id,
        })),
      }),
    );
  }
  operations.push(history);

  await prisma.$transaction(operations);

  return {
    count: toCreate.length,
    skipped: errors.length,
    errors,
  };
};

// csv export
export const exportCsv = async (currentUser: {
  id: number;
  type: UserType;
}): Promise<string> => {
  const where = {
    deletedAt: null,
    ...(currentUser.type !== UserType.ADMIN && {
      createUserId: currentUser.id,
    }),
  };

  const posts = await prisma.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  let csv = "ID,Title,Description,Status,Created At\n";

  for (const post of posts) {
    const sanitizedTitle = `"${post.title.replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
    const sanitizedDesc = `"${post.description ? post.description.replace(/"/g, '""').replace(/\r?\n/g, " ") : ""}"`;
    const formattedDate = post.createdAt.toISOString().split("T")[0];

    csv += `${post.id},${sanitizedTitle},${sanitizedDesc},${post.status},${formattedDate}\n`;
  }

  return csv;
};

// get import histories
export const getImportHistories = async (
  pagination: PaginationInput,
  currentUser: { id: number; type: UserType },
) => {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const where = {
    ...(currentUser.type !== UserType.ADMIN && {
      createUserId: currentUser.id,
    }),
  };

  const [histories, total] = await prisma.$transaction([
    prisma.importHistory.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        createUser: { select: { name: true } },
      },
    }),
    prisma.importHistory.count({ where }),
  ]);

  return {
    histories: histories.map((item, index) => ({
      no: skip + index + 1,
      id: item.id,
      importFile: item.filename,
      importTimestamp: item.createdAt,
      recordsImported: item.totalImported,
      status: item.status,
      user: item.createUser?.name || "Unknown",
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// delete import history
export const removeImportHistory = async (
  id: number,
  currentUser: { id: number; type: UserType },
) => {
  const existing = await prisma.importHistory.findFirst({
    where: {
      id,
      ...(currentUser.type !== UserType.ADMIN && {
        createUserId: currentUser.id,
      }),
    },
  });

  if (!existing) {
    throw new AppError(
      "Import history not found or unauthorized to delete",
      404,
    );
  }

  await prisma.importHistory.delete({ where: { id } });
  return { message: "Import history deleted successfully" };
};

// get post history
export const getPostHistory = async (
  pagination: PaginationInput,
  currentUser: {
    id: number;
    type: UserType;
  },
) => {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const where = {
    deletedAt: null,
    ...(currentUser.type !== UserType.ADMIN && {
      createUserId: currentUser.id,
    }),
  };

  const [posts, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        createUser: { select: { name: true } },
      },
    }),
    prisma.post.count({ where }),
  ]);

  return {
    posts: posts.map((post, index) => ({
      no: skip + index + 1,
      postId: post.id,
      postTitle: post.title,
      userName: post.createUser?.name || "Unknown",
      description: post.description,
      createdAt: post.createdAt,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// toggle reaction
export const toggleReaction = async (
  id: number,
  currentUser: { id: number; type: UserType },
) => {
  const post = await prisma.post.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!post) {
    throw new AppError("Post not found", 404);
  }

  const existingReaction = await prisma.postReaction.findUnique({
    where: {
      postId_userId: {
        postId: id,
        userId: currentUser.id,
      },
    },
  });

  if (existingReaction) {
    await prisma.postReaction.delete({
      where: {
        id: existingReaction.id,
      },
    });
    return { message: "Reaction removed successfully", liked: false };
  }

  try {
    await prisma.postReaction.create({
      data: {
        userId: currentUser.id,
        postId: id,
      },
    });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return { message: "Reaction already exists", liked: true };
    }
    throw error;
  }

  return { message: "Reaction added successfully", liked: true };
};

// get post's reactions
export const getReactions = async (postId: number) => {
  const post = await prisma.post.findFirst({
    where: {
      id: postId,
      deletedAt: null,
    },
  });

  if (!post) {
    throw new AppError("Post not found", 404);
  }

  const reactions = await prisma.postReaction.findMany({
    where: {
      postId: postId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const likedUsers = reactions.map((reaction) => reaction.user);
  return {
    totalLikes: likedUsers.length,
    users: likedUsers,
  };
};
