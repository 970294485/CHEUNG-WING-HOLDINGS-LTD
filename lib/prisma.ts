import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";

loadEnvConfig(process.cwd());

function normalizeEnvValue(value: string | undefined): string | undefined {
  if (value == null) return undefined;
  const t = value.replace(/^\uFEFF/, "").trim();
  return t.length ? t : undefined;
}

function requirePostgresUrl(envKey: "DATABASE_URL" | "DIRECT_URL"): string {
  const raw = normalizeEnvValue(process.env[envKey]);
  if (
    raw &&
    (raw.startsWith("postgresql://") || raw.startsWith("postgres://"))
  ) {
    return raw;
  }
  throw new Error(
    `${envKey} 未設置或不是有效的 PostgreSQL 連線字串（需以 postgresql:// 或 postgres:// 開頭）。請在專案根目錄 .env 中配置 Neon 等連線。`,
  );
}

const databaseUrl = requirePostgresUrl("DATABASE_URL");
process.env.DATABASE_URL = databaseUrl;

let directUrl = normalizeEnvValue(process.env.DIRECT_URL);
if (
  !directUrl ||
  (!directUrl.startsWith("postgresql://") && !directUrl.startsWith("postgres://"))
) {
  directUrl = databaseUrl;
}
process.env.DIRECT_URL = directUrl;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const log: Prisma.LogLevel[] =
  process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];

function createPrismaClient() {
  return new PrismaClient({
    log,
    datasources: { db: { url: databaseUrl } },
  });
}

/**
 * globalThis 上的 PrismaClient 可能早於最近一次 `prisma generate`（例如 dev 熱更新、
 * 或舊程序未退出），舊實例沒有新 model 的 delegate，會出現 `undefined.count`。
 * 一律偵測並換成當前 `@prisma/client` 對應的新實例；development / production 皆適用。
 */
function needsPrismaClientReplace(c: PrismaClient | null | undefined): boolean {
  if (c == null) return true;
  type WithDelegates = {
    documentCaseCategory?: { count?: (...args: unknown[]) => Promise<unknown> };
    documentCase?: { count?: (...args: unknown[]) => Promise<unknown> };
  };
  const x = c as unknown as WithDelegates;
  return (
    typeof x.documentCaseCategory?.count !== "function" ||
    typeof x.documentCase?.count !== "function"
  );
}

export const prisma: PrismaClient = (() => {
  let g: PrismaClient | undefined = globalForPrisma.prisma;
  if (needsPrismaClientReplace(g)) {
    if (g) void g.$disconnect().catch(() => {});
    g = createPrismaClient();
    globalForPrisma.prisma = g;
    return g;
  }
  return g as PrismaClient;
})();
