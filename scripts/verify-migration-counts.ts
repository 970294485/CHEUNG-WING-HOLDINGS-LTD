import "dotenv/config";
import Database from "better-sqlite3";
import { Client } from "pg";
import * as path from "path";

const SQLITE_PATH = path.join(process.cwd(), "prisma", "dev.db");
const PG_URL = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

async function main() {
  if (!PG_URL) throw new Error("缺少 DIRECT_URL / DATABASE_URL");

  const sqlite = new Database(SQLITE_PATH, { readonly: true });
  const pg = new Client({ connectionString: PG_URL });
  await pg.connect();

  const tables = sqlite
    .prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '_prisma_migrations' ORDER BY name`,
    )
    .all() as { name: string }[];

  let ok = true;
  for (const { name: t } of tables) {
    const sq = sqlite.prepare(`SELECT COUNT(*) as c FROM "${t.replace(/"/g, '""')}"`).get() as { c: number };
    const pgRes = await pg.query(`SELECT COUNT(*)::int as c FROM "${t.replace(/"/g, '""')}"`);
    const pc = pgRes.rows[0]?.c ?? -1;
    const match = sq.c === pc;
    if (!match) ok = false;
    console.log(`${match ? "OK" : "MISMATCH"}\t${t}\tsqlite=${sq.c}\tneon=${pc}`);
  }

  sqlite.close();
  await pg.end();
  if (!ok) process.exit(1);
  console.log("\n全部表行数一致。");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
