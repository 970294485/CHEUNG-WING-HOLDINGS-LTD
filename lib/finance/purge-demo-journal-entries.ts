import type { PrismaClient } from "@prisma/client";

/** 舊種子／演示憑證摘要慣用標記（全公司刪除，不動請款來源憑證）。 */
const DEMO_MARKER = "（演示）";

/**
 * 刪除摘要中含「（演示）」的憑證及其分錄（級聯）。
 * 不刪除 sourceType=PAYMENT_REQUEST 等業務來源憑證。
 */
export async function purgeDemoLabeledJournalEntries(db: PrismaClient): Promise<number> {
  const r = await db.journalEntry.deleteMany({
    where: {
      description: { contains: DEMO_MARKER },
    },
  });
  return r.count;
}
