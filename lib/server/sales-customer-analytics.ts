import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

function dec(n: Prisma.Decimal | null | undefined): number {
  if (n == null) return 0;
  return Number(n);
}

function yearBounds(year: number): { start: Date; end: Date } {
  return {
    start: new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0)),
    end: new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)),
  };
}

const docActive: Prisma.SalesDocumentWhereInput = {
  status: { not: "CANCELLED" },
};

/** 本年銷售單據（報價/合同/預收發票，不含已取消）用於趨勢與客單 */
export async function getSalesYearAnalytics(companyId: string, year: number) {
  const { start, end } = yearBounds(year);

  const documents = await prisma.salesDocument.findMany({
    where: {
      companyId,
      ...docActive,
      date: { gte: start, lte: end },
    },
    select: { date: true, totalAmount: true, type: true, status: true },
  });

  const monthly = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    return { month: `${m}月`, monthIndex: m, revenue: 0 };
  });

  let contractWon = 0;
  for (const d of documents) {
    const amt = dec(d.totalAmount);
    const month = new Date(d.date).getUTCMonth() + 1;
    if (month >= 1 && month <= 12) {
      monthly[month - 1].revenue += amt;
    }
    if (
      d.type === "CONTRACT" &&
      (d.status === "CONFIRMED" || d.status === "COMPLETED")
    ) {
      contractWon += amt;
    }
  }

  const totalDocAmount = documents.reduce((s, d) => s + dec(d.totalAmount), 0);
  const docCount = documents.length;
  const avgTicket = docCount > 0 ? totalDocAmount / docCount : 0;

  const maxMonthRev = Math.max(...monthly.map((x) => x.revenue), 0);

  const grouped = await prisma.salesDocumentItem.groupBy({
    by: ["productId"],
    where: {
      salesDocument: {
        companyId,
        ...docActive,
        date: { gte: start, lte: end },
      },
    },
    _sum: { quantity: true, total: true },
    orderBy: { _sum: { total: "desc" } },
    take: 5,
  });

  const productIds = grouped.map((g) => g.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, sku: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const topProducts = grouped.map((g) => {
    const p = byId.get(g.productId);
    const name = p ? `${p.name}${p.sku ? ` (${p.sku})` : ""}` : g.productId;
    return {
      name,
      sales: g._sum.quantity ?? 0,
      revenue: dec(g._sum.total),
    };
  });

  return {
    year,
    totalDocAmount,
    contractWon,
    docCount,
    avgTicket,
    monthly: monthly.map(({ month, revenue }) => ({
      month,
      revenue,
      barPct: maxMonthRev > 0 ? Math.min((revenue / maxMonthRev) * 100, 100) : 0,
    })),
    topProducts,
  };
}

/** 客戶來源分佈 + 簡單漏斗（客戶去重計數） */
export async function getCustomerAnalytics(companyId: string) {
  const sourceRows = await prisma.customer.findMany({
    where: { companyId },
    select: { source: true },
  });

  const sourceMap = new Map<string, number>();
  for (const c of sourceRows) {
    const key = (c.source && c.source.trim()) || "未填寫";
    sourceMap.set(key, (sourceMap.get(key) ?? 0) + 1);
  }
  const total = sourceRows.length;
  const customerSources = [...sourceMap.entries()]
    .map(([source, count]) => ({
      source,
      count,
      percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const base = { companyId };
  const [withFollow, withQuote, withWonContract] = await Promise.all([
    prisma.customer.count({
      where: { ...base, followUps: { some: {} } },
    }),
    prisma.customer.count({
      where: {
        ...base,
        salesDocuments: {
          some: { type: "QUOTATION", status: { not: "CANCELLED" } },
        },
      },
    }),
    prisma.customer.count({
      where: {
        ...base,
        salesDocuments: {
          some: {
            type: "CONTRACT",
            status: { in: ["CONFIRMED", "COMPLETED"] },
          },
        },
      },
    }),
  ]);

  const pct = (n: number) =>
    total > 0 ? `${((n / total) * 100).toFixed(1)}%` : "0%";

  const conversionRates = [
    {
      stage: "客戶檔案 (總數)",
      count: total,
      rate: total > 0 ? "100%" : "—",
    },
    { stage: "有跟進記錄", count: withFollow, rate: pct(withFollow) },
    { stage: "有報價單", count: withQuote, rate: pct(withQuote) },
    {
      stage: "有成交合同",
      count: withWonContract,
      rate: pct(withWonContract),
    },
  ];

  return { customerSources, conversionRates, totalCustomers: total };
}
