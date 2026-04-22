/**
 * 從 DEMO 同步系統主數據到其他公司，並補齊請款→憑證。
 *
 * Usage:
 *   npx tsx scripts/sync-system-from-demo.ts           # 除 DEMO 外全部公司
 *   npx tsx scripts/sync-system-from-demo.ts ACME      # 僅指定 company code
 */
import { PrismaClient } from "@prisma/client";
import { syncSystemMasterFromDemo } from "@/lib/system/sync-system-master-from-demo";
import { syncPaidPaymentRequestToJournal } from "@/lib/finance/sync-payment-request-journal";

const prisma = new PrismaClient();

async function main() {
  const arg = process.argv[2]?.trim();
  const summary = await syncSystemMasterFromDemo(prisma, {
    targetCompanyCode: arg || undefined,
  });

  if (!summary.demoFound) {
    console.error("未找到 code=DEMO 的公司，請先執行 npm run db:seed");
    process.exitCode = 1;
    return;
  }

  console.log("系統主數據同步（自 DEMO）：");
  for (const t of summary.targets) {
    console.log(
      `  ${t.code}: 科目模板=${t.chartCopied ? "已複製" : "略過"}, 單號規則=${t.rulesCopied ? "已複製" : "略過"}, 堅果目錄=已執行`,
    );
  }

  const paid = await prisma.paymentRequest.findMany({
    where: { status: "PAID" },
    select: { id: true, companyId: true },
  });
  let jeCreated = 0;
  let jeSkipped = 0;
  let jeFail = 0;
  for (const p of paid) {
    const r = await syncPaidPaymentRequestToJournal(prisma, p.companyId, p.id);
    if (!r.ok) jeFail += 1;
    else if (r.created) jeCreated += 1;
    else jeSkipped += 1;
  }
  console.log(
    `請款憑證同步: created=${jeCreated}, already_synced=${jeSkipped}, failed=${jeFail}, total_paid=${paid.length}`,
  );
  console.log("完成。");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
