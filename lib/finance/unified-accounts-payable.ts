import type { ArApStatus, PaymentRequestStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * 由請款單推導應付：已提交/已通過視為待付；已支付視為已結清。
 * 草稿、已駁回不計入應付臺帳。
 */
function prToApStatus(s: PaymentRequestStatus): ArApStatus | null {
  if (s === "PAID") return "CLOSED";
  if (s === "SUBMITTED" || s === "APPROVED") return "OPEN";
  return null;
}

export type UnifiedApRow = {
  id: string;
  source: "MANUAL" | "PAYMENT_REQUEST";
  paymentRequestId: string | null;
  vendorName: string;
  description: string | null;
  billNo: string | null;
  amount: number;
  paidAmount: number;
  issueDate: Date;
  dueDate: Date | null;
  status: ArApStatus;
  /** 請款單：部門 / 請款人（手動列為 null） */
  department: string | null;
  requestedBy: string | null;
};

/**
 * 手動 AccountsPayable + 請款單驅動之待付（與請款單狀態同步）。
 */
export async function loadUnifiedAccountsPayable(companyId: string): Promise<UnifiedApRow[]> {
  const [manual, requests] = await Promise.all([
    prisma.accountsPayable.findMany({
      where: { companyId },
      orderBy: { issueDate: "desc" },
      take: 120,
    }),
    prisma.paymentRequest.findMany({
      where: {
        companyId,
        status: { in: ["SUBMITTED", "APPROVED", "PAID"] },
      },
      orderBy: { createdAt: "desc" },
      take: 120,
    }),
  ]);

  const fromManual: UnifiedApRow[] = manual.map((m) => ({
    id: `manual:${m.id}`,
    source: "MANUAL",
    paymentRequestId: null,
    vendorName: m.vendorName,
    description: m.description,
    billNo: m.billNo,
    amount: Number(m.amount),
    paidAmount: Number(m.paidAmount),
    issueDate: m.issueDate,
    dueDate: m.dueDate ?? null,
    status: m.status,
    department: null,
    requestedBy: null,
  }));

  const fromPr: UnifiedApRow[] = [];
  for (const p of requests) {
    const st = prToApStatus(p.status);
    if (!st) continue;
    const amount = Number(p.amount);
    const paid = p.status === "PAID" ? amount : 0;
    const parts = [
      p.purpose,
      p.department ? `部門：${p.department}` : null,
      p.requestedBy ? `請款人：${p.requestedBy}` : null,
    ].filter(Boolean);
    fromPr.push({
      id: `pr:${p.id}`,
      source: "PAYMENT_REQUEST",
      paymentRequestId: p.id,
      vendorName: `[請款] ${p.title}`,
      description: parts.length ? parts.join("；") : null,
      billNo: `PR-${p.id.slice(-8).toUpperCase()}`,
      amount,
      paidAmount: paid,
      issueDate: p.createdAt,
      dueDate: null,
      status: st,
      department: p.department,
      requestedBy: p.requestedBy,
    });
  }

  return [...fromManual, ...fromPr]
    .sort((a, b) => b.issueDate.getTime() - a.issueDate.getTime())
    .slice(0, 150);
}
