import { z } from "zod";
import { UserType } from "@prisma/client";

export const createUserSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters long"),
  email: z.string().trim().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  profile: z.string().trim().max(255).optional(),
  phone: z.string().trim().max(20).optional(),
  address: z.string().trim().max(255).optional(),
  dob: z.string().optional(),
  type: z.nativeEnum(UserType).default(UserType.USER),
});

export const updateUserSchema = createUserSchema.omit({
  email: true,
  password: true,
}).partial();

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
