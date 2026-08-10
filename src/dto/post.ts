import { Post, PostStatus } from "@prisma/client";

type PostWithUser = Post & {
  createUser?: { name: string } | null;
  updatedUser?: { name: string } | null;
  deletedUser?: { name: string } | null;
  _count?: { reactions: number };
};

export class PostDto {
  id: number;
  title: string;
  description: string;
  status: PostStatus;
  reactionCount: number;
  createUsername: string | null;
  updatedUserName: string | null;
  deletedUserName: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  constructor(post: PostWithUser) {
    this.id = post.id;
    this.title = post.title;
    this.description = post.description;
    this.status = post.status;
    this.reactionCount = post._count?.reactions ?? 0;
    this.createUsername = post.createUser?.name || null;
    this.updatedUserName = post.updatedUser?.name || null;
    this.deletedUserName = post.deletedUser?.name || null;
    this.createdAt = post.createdAt;
    this.updatedAt = post.updatedAt;
    this.deletedAt = post.deletedAt;
  }

  static plainToInstance(post: PostWithUser): PostDto {
    return new PostDto(post);
  }
}
