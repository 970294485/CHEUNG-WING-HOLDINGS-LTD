/**
 * Prisma 在執行 `prisma generate` 時會驗證 schema 中的 env("DATABASE_URL") 已存在。
 * Vercel / CI 若尚未注入真實連線，可用此占位通過驗證（不會在 generate 時連線）。
 * 應用程式執行時仍須在平台設定真實的 DATABASE_URL。
 */
const { execSync } = require("node:child_process");

const env = { ...process.env };
if (!String(env.DATABASE_URL ?? "").trim()) {
  env.DATABASE_URL =
    "postgresql://build:build@127.0.0.1:5432/build?schema=public";
}

execSync("npx prisma generate", { stdio: "inherit", env });
