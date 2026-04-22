import "dotenv/config";

/**
 * 将本地 prisma/dev.db (SQLite) 全表复制到 Neon PostgreSQL。
 * 需已执行 `npx prisma db push` 且 .env 中 DATABASE_URL / DIRECT_URL 指向 Neon。
 *
 * 运行: npx tsx scripts/migrate-sqlite-to-neon.ts
 * 若目标库已有数据会主键冲突，需先清空再迁：
 *   PowerShell: $env:MIGRATE_RESET="1"; npm run migrate:sqlite-to-neon
 */
import Database from "better-sqlite3";
import { Client } from "pg";
import * as path from "path";

const SQLITE_PATH = process.env.SQLITE_PATH ?? path.join(process.cwd(), "prisma", "dev.db");
const PG_URL = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

/** 跨表插入顺序（父表在前）；Neon 普通用户不可设 session_replication_role */
const TABLE_ORDER: string[] = [
  "Company",
  "User",
  "Permission",
  "AccountingCategory",
  "GlAccount",
  "DocumentNumberRule",
  "Role",
  "RolePermission",
  "UserRole",
  "CustomerGroup",
  "CustomerSource",
  "Product",
  "Customer",
  "CustomerFollowUp",
  "JournalEntry",
  "JournalLine",
  "BudgetLine",
  "PaymentRequest",
  "ApprovalLog",
  "Prepayment",
  "AccountsReceivable",
  "AccountsPayable",
  "SalesDocument",
  "SalesDocumentItem",
  "PurchaseOrder",
  "PurchaseOrderItem",
  "InventoryBalance",
  "InventoryTransaction",
  "FileCategory",
  "FileDocument",
];

function topoByParentId(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  const byId = new Map(rows.map((r) => [r.id as string, r]));
  const remaining = new Set(rows.map((r) => r.id as string));
  const sorted: Record<string, unknown>[] = [];
  while (remaining.size) {
    let progress = false;
    for (const id of [...remaining]) {
      const r = byId.get(id)!;
      const pid = r.parentId as string | null | undefined;
      if (pid == null || !remaining.has(pid)) {
        sorted.push(r);
        remaining.delete(id);
        progress = true;
      }
    }
    if (!progress) throw new Error("自引用 parentId 存在环或孤立父节点");
  }
  return sorted;
}

function sortRowsForTable(table: string, rows: Record<string, unknown>[]): Record<string, unknown>[] {
  if (table === "GlAccount" || table === "FileCategory" || table === "SalesDocument") {
    return topoByParentId(rows);
  }
  return rows;
}

function isLikelyEpochMs(n: number): boolean {
  return n > 1_000_000_000_000 && n < 100_000_000_000_000;
}

/** Prisma SQLite 将 DateTime 存为毫秒时间戳；PostgreSQL 需 timestamp/timestamptz */
function toPgValue(v: unknown, col: string): unknown {
  if (v === null || v === undefined) return null;
  if (typeof v === "bigint") return v.toString();
  if (Buffer.isBuffer(v)) return v;
  if (typeof v === "number" && isLikelyEpochMs(v) && /At$|Date$/i.test(col)) {
    return new Date(v).toISOString();
  }
  if (typeof v === "object" && v !== null && !(v instanceof Date) && !Buffer.isBuffer(v)) {
    return JSON.stringify(v);
  }
  return v;
}

async function main() {
  if (!PG_URL) {
    throw new Error("请设置 DIRECT_URL 或 DATABASE_URL（Neon 连接串）");
  }

  const sqlite = new Database(SQLITE_PATH, { fileMustExist: true, readonly: true });
  const pg = new Client({ connectionString: PG_URL });
  await pg.connect();

  const doReset = process.env.MIGRATE_RESET === "1" || process.argv.includes("--reset");
  if (doReset) {
    const agg = await pg.query<{ names: string | null }>(`
      SELECT string_agg(format('%I', c.relname), ', ' ORDER BY c.relname) AS names
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relkind = 'r'
        AND c.relname IS DISTINCT FROM '_prisma_migrations'
    `);
    const names = agg.rows[0]?.names;
    if (names) {
      await pg.query(`TRUNCATE TABLE ${names} CASCADE`);
      console.log("已按 MIGRATE_RESET 清空 public 业务表，开始插入…\n");
    }
  }

  const discovered = sqlite
    .prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '_prisma_migrations'`,
    )
    .all() as { name: string }[];

  const rank = (name: string) => {
    const i = TABLE_ORDER.indexOf(name);
    return i === -1 ? 999 : i;
  };
  const tables = [...discovered].sort((a, b) => rank(a.name) - rank(b.name) || a.name.localeCompare(b.name));

  for (const { name: table } of tables) {
    const rawRows = sqlite.prepare(`SELECT * FROM "${table.replace(/"/g, '""')}"`).all() as Record<string, unknown>[];
    const rows = sortRowsForTable(table, rawRows);
    if (rows.length === 0) continue;

    const cols = Object.keys(rows[0]!);
    const quotedCols = cols.map((c) => `"${c.replace(/"/g, '""')}"`).join(", ");
    const qTable = `"${table.replace(/"/g, '""')}"`;

    let inserted = 0;
    for (const row of rows) {
      const values = cols.map((c) => toPgValue(row[c], c));
      const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
      const sql = `INSERT INTO ${qTable} (${quotedCols}) VALUES (${placeholders})`;
      try {
        await pg.query(sql, values as unknown[]);
        inserted++;
      } catch (e) {
        console.error(`表 ${table} 插入失败 (约第 ${inserted + 1} 行):`, e);
        throw e;
      }
    }
    console.log(`表 ${table}: ${inserted} 行`);
  }

  await pg.end();
  sqlite.close();
  console.log("迁移完成。");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
