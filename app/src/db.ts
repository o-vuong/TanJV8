import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__prisma || new PrismaClient().$extends(withAccelerate());

if (process.env.NODE_ENV !== "production") {
	globalThis.__prisma = prisma;
}
