import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { PrismaClient } from "@prisma/client";

const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST || "localhost",
  port: 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME,
  connectionLimit: 5,
});

const prisma = new PrismaClient({
  adapter,
  log:
    process.env.ENV === "development"
      ? ["query", "info", "warn", "error"]
      : undefined,
});

export default prisma;
