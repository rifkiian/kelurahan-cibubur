import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
  if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) {
    dotenv.config();
  }
}

export const prisma = new PrismaClient();
