import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

let dbUrl = "file:./dev.db";

if (process.env.NODE_ENV === "production") {
  // In Vercel, the file system is read-only except for /tmp.
  // We need to copy the SQLite DB to /tmp to allow Prisma to read/write.
  const sourcePath = path.join(process.cwd(), "prisma", "dev.db");
  const destPath = path.join("/tmp", "dev.db");
  
  try {
    if (!fs.existsSync(destPath) && fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      console.log("Copied SQLite DB to /tmp");
    }
    dbUrl = `file:${destPath}`;
  } catch (e) {
    console.error("Failed to copy SQLite DB to /tmp:", e);
    // Fallback to source path (might fail on write)
    dbUrl = `file:${sourcePath}`;
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
