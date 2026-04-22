/**
 * 將所有「已支付」請款單冪等同步為會計憑證（尚未建立對應憑證者）。
 * 需已存在科目 5100（管理費用）、1100（銀行存款）。
 *
 * Usage: npx tsx scripts/sync-paid-pr-journals.ts
 */
import { PrismaClient } from "@prisma/client";
import { syncPaidPaymentRequestToJournal } from "../lib/finance/sync-payment-request-journal";

const prisma = new PrismaClient();

async function main() {
  const paid = await prisma.paymentRequest.findMany({
    where: { status: "PAID" },
    select: { id: true, companyId: true, title: true },
    orderBy: { createdAt: "asc" },
  });
  let created = 0;
  let skipped = 0;
  let failed = 0;
  for (const p of paid) {
    const r = await syncPaidPaymentRequestToJournal(prisma, p.companyId, p.id);
    if (!r.ok) {
      failed += 1;
      console.warn(`[skip] ${p.id} ${p.title}: ${r.reason}`);
      continue;
    }
    if (r.created) created += 1;
    else skipped += 1;
  }
  console.log(`Done. created=${created}, already_synced=${skipped}, failed=${failed}, total_paid=${paid.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
