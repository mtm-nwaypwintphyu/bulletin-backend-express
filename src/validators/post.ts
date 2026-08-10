import z from "zod";
import { PostStatus } from "@prisma/client";
const postBaseSchema = {
  title: z
    .string()
    .trim()
    .min(2, "Title must be at least 2 characters long")
    .max(255, "Title cannot exceed 255 characters"),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(255, "Description cannot exceed 255 characters"),
  status: z
    .enum([PostStatus.ACTIVE, PostStatus.INACTIVE])
    .default(PostStatus.ACTIVE),
};

export const createPostSchema = z.object(postBaseSchema);

export const updatePostSchema = createPostSchema.partial();

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().max(255).optional(),
});

export const importPostSchema = z.object({
  ...postBaseSchema,
  status: z.enum([PostStatus.ACTIVE, PostStatus.INACTIVE]).optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type ImportPostInput = z.infer<typeof importPostSchema>;
