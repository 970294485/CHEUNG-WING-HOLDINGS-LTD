/**
 * Prisma 在執行 `prisma generate` 時會驗證 schema 中的 env("DATABASE_URL") 已存在。
 * Vercel / CI 若尚未注入真實連線，可用此占位通過驗證（不會在 generate 時連線）。
 * 應用程式執行時仍須在平台設定真實的 DATABASE_URL。
 */
const { spawnSync } = require("node:child_process");

const env = { ...process.env };
if (!String(env.DATABASE_URL ?? "").trim()) {
  env.DATABASE_URL =
    "postgresql://build:build@127.0.0.1:5432/build?schema=public";
}

const r = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["prisma", "generate"],
  {
    env,
    stdio: ["inherit", "inherit", "pipe"],
    encoding: "utf-8",
    shell: process.platform === "win32",
  },
);

if (r.stderr) {
  process.stderr.write(r.stderr);
}

if (r.status === 0) {
  process.exit(0);
}

const combined = `${r.stderr || ""}\n${r.stdout || ""}`;
if (combined.includes("EPERM") || /operation not permitted/i.test(combined)) {
  console.warn(
    "[prisma-generate] 跳過：無法覆寫 query_engine（通常因 next dev 或其它進程鎖定 node_modules）。請關閉 dev 後執行 npx prisma generate。",
  );
  process.exit(0);
}

process.exit(r.status ?? 1);
