/**
 * 依「實際業務」整理會計憑證：
 * 1) 移除摘要含「（演示）」的舊演示憑證
 * 2) 將「已支付」請款單冪等同步為憑證
 *
 * Usage: npx tsx scripts/reconcile-accounting-journals.ts
 */
import { PrismaClient } from "@prisma/client";
import { purgeDemoLabeledJournalEntries } from "@/lib/finance/purge-demo-journal-entries";
import { syncPaidPaymentRequestToJournal } from "@/lib/finance/sync-payment-request-journal";

const prisma = new PrismaClient();

async function main() {
  const purged = await purgeDemoLabeledJournalEntries(prisma);
  console.log(`已刪除演示標記憑證: ${purged} 筆`);

  const paid = await prisma.paymentRequest.findMany({
    where: { status: "PAID" },
    select: { id: true, companyId: true },
  });
  let created = 0;
  let skipped = 0;
  let failed = 0;
  for (const p of paid) {
    const r = await syncPaidPaymentRequestToJournal(prisma, p.companyId, p.id);
    if (!r.ok) failed += 1;
    else if (r.created) created += 1;
    else skipped += 1;
  }
  console.log(
    `請款憑證同步: created=${created}, already_synced=${skipped}, failed=${failed}, total_paid=${paid.length}`,
  );
  console.log("完成。");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
