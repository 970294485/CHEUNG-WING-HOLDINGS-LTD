import type { PrismaClient } from "@prisma/client";
import { JournalEntryStatus } from "@prisma/client";
import { nextJournalEntryNo } from "@/lib/finance/journal-entry-no";

export const JOURNAL_SOURCE_PAYMENT_REQUEST = "PAYMENT_REQUEST" as const;

/** 與 seed 一致：管理費用、銀行存款 */
const EXPENSE_GL_CODE = "5100";
const BANK_GL_CODE = "1100";

export type SyncPaidPrJournalResult =
  | { ok: true; created: boolean; entryId: string }
  | { ok: false; reason: "not_paid" | "already_synced" | "missing_request" | "missing_gl" };

/**
 * 已支付請款單 → 一筆已過帳憑證（借管理費用、貸銀行存款），冪等。
 */
export async function syncPaidPaymentRequestToJournal(
  db: PrismaClient,
  companyId: string,
  paymentRequestId: string,
): Promise<SyncPaidPrJournalResult> {
  const existing = await db.journalEntry.findFirst({
    where: {
      companyId,
      sourceType: JOURNAL_SOURCE_PAYMENT_REQUEST,
      sourceId: paymentRequestId,
    },
  });
  if (existing) return { ok: true, created: false, entryId: existing.id };

  const pr = await db.paymentRequest.findFirst({
    where: { id: paymentRequestId, companyId },
  });
  if (!pr) return { ok: false, reason: "missing_request" };
  if (pr.status !== "PAID") return { ok: false, reason: "not_paid" };

  const [expenseGl, bankGl, category] = await Promise.all([
    db.glAccount.findFirst({ where: { companyId, code: EXPENSE_GL_CODE, isActive: true } }),
    db.glAccount.findFirst({ where: { companyId, code: BANK_GL_CODE, isActive: true } }),
    db.accountingCategory.findFirst({
      where: { companyId, code: { in: ["ADM", "GEN"] } },
      orderBy: { code: "asc" },
    }),
  ]);
  if (!expenseGl || !bankGl) return { ok: false, reason: "missing_gl" };

  const amount = pr.amount;
  const entryNo = await nextJournalEntryNo(companyId);
  const entryDate = pr.approvedAt ?? pr.createdAt;
  const descParts = [`請款已支付：${pr.title}`];
  if (pr.purpose) descParts.push(pr.purpose);

  const entry = await db.journalEntry.create({
    data: {
      companyId,
      entryNo,
      entryDate,
      description: descParts.join(" · ").slice(0, 500),
      status: JournalEntryStatus.POSTED,
      sourceType: JOURNAL_SOURCE_PAYMENT_REQUEST,
      sourceId: pr.id,
      lines: {
        create: [
          {
            glAccountId: expenseGl.id,
            debit: amount,
            credit: 0,
            memo: "請款費用",
            accountingCategoryId: category?.id ?? null,
          },
          {
            glAccountId: bankGl.id,
            debit: 0,
            credit: amount,
            memo: "銀行付款",
            accountingCategoryId: category?.id ?? null,
          },
        ],
      },
    },
  });

  return { ok: true, created: true, entryId: entry.id };
}
