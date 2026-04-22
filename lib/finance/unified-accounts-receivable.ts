import type { ArApStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sumPrepaymentsLinkedToContract } from "@/lib/finance/contract-prepay-data";

function arStatusFromOutstanding(total: number, received: number): ArApStatus {
  const out = total - received;
  if (out < 0.005) return "CLOSED";
  if (received > 0.005) return "PARTIAL";
  return "OPEN";
}

/** 應收帳款頁統一列：銷售合同驅動 + 手動 AccountsReceivable */
export type UnifiedArRow = {
  id: string;
  source: "CONTRACT" | "MANUAL";
  salesDocumentId: string | null;
  customerId: string | null;
  customerName: string;
  invoiceNo: string | null;
  description: string | null;
  amount: number;
  receivedAmount: number;
  issueDate: Date;
  dueDate: Date | null;
  status: ArApStatus;
};

/**
 * 與銷售合同、預收款對接同步：每份有效合同一列，「已收」= 已對接至該合同的預收加總。
 * 另併入手動登記之 AccountsReceivable（如發票尾款、系統外應收）。
 */
export async function loadUnifiedAccountsReceivable(
  companyId: string,
  options?: { filterCustomerId?: string | null }
): Promise<UnifiedArRow[]> {
  const filterId = options?.filterCustomerId?.trim() || null;

  const [contracts, prepayments, manual] = await Promise.all([
    prisma.salesDocument.findMany({
      where: {
        companyId,
        type: "CONTRACT",
        status: { not: "CANCELLED" },
        ...(filterId ? { customerId: filterId } : {}),
      },
      include: { customer: { select: { id: true, name: true } } },
      orderBy: { date: "desc" },
      take: 150,
    }),
    prisma.prepayment.findMany({
      where: { companyId },
      select: { linkedDocumentId: true, amount: true },
    }),
    prisma.accountsReceivable.findMany({
      where: {
        companyId,
        ...(filterId ? { customerId: filterId } : {}),
      },
      include: { customer: { select: { name: true } } },
      orderBy: { issueDate: "desc" },
      take: 150,
    }),
  ]);

  const fromContracts: UnifiedArRow[] = contracts.map((c) => {
    const amount = Number(c.totalAmount);
    const receivedAmount = sumPrepaymentsLinkedToContract(prepayments, c.id, c.documentNo);
    const status = arStatusFromOutstanding(amount, receivedAmount);
    return {
      id: `contract:${c.id}`,
      source: "CONTRACT",
      salesDocumentId: c.id,
      customerId: c.customerId,
      customerName: c.customer?.name ?? "—",
      invoiceNo: c.documentNo,
      description:
        (c.notes && c.notes.trim()) ||
        "來自銷售合同；「已收」為已對接至本合同的預收款（與預收款對接頁口徑一致）。",
      amount,
      receivedAmount,
      issueDate: c.date,
      dueDate: c.dueDate ?? null,
      status,
    };
  });

  const fromManual: UnifiedArRow[] = manual.map((m) => ({
    id: `manual:${m.id}`,
    source: "MANUAL",
    salesDocumentId: null,
    customerId: m.customerId,
    customerName: m.customer?.name ?? m.customerName,
    invoiceNo: m.invoiceNo,
    description: m.description,
    amount: Number(m.amount),
    receivedAmount: Number(m.receivedAmount),
    issueDate: m.issueDate,
    dueDate: m.dueDate ?? null,
    status: m.status,
  }));

  return [...fromContracts, ...fromManual]
    .sort((a, b) => b.issueDate.getTime() - a.issueDate.getTime())
    .slice(0, 120);
}
