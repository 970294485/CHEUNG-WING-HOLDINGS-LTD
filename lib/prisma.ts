import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";

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

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const log: NonNullable<ConstructorParameters<typeof PrismaClient>[0]["log"]> =
  process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log,
    datasources: { db: { url: databaseUrl } },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
