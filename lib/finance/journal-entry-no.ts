import { prisma } from "@/lib/prisma";

/** 依公司與當月序號產生 JE-YYYYMM-### */
export async function nextJournalEntryNo(companyId: string): Promise<string> {
  const now = new Date();
  const prefix = `JE-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const last = await prisma.journalEntry.findFirst({
    where: { companyId, entryNo: { startsWith: prefix } },
    orderBy: { entryNo: "desc" },
  });
  let seq = 1;
  if (last?.entryNo) {
    const part = last.entryNo.split("-").pop();
    seq = (Number.parseInt(part ?? "0", 10) || 0) + 1;
  }
  return `${prefix}-${String(seq).padStart(3, "0")}`;
}
