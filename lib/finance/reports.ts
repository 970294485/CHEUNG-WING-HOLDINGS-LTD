import type { GlAccountType } from "@prisma/client";
import { prisma } from "../prisma";
import { Prisma } from "@prisma/client";

function d(n: Prisma.Decimal | number | string): Prisma.Decimal {
  return new Prisma.Decimal(n);
}

function add(a: Prisma.Decimal, b: Prisma.Decimal): Prisma.Decimal {
  return a.add(b);
}

function sub(a: Prisma.Decimal, b: Prisma.Decimal): Prisma.Decimal {
  return a.sub(b);
}

/** 按科目類型計算餘額：借方科目 balance = 借-貸；貸方科目 balance = 貸-借 */
export function lineBalanceForType(
  type: GlAccountType,
  debit: Prisma.Decimal,
  credit: Prisma.Decimal,
): Prisma.Decimal {
  if (type === "ASSET" || type === "EXPENSE") {
    return sub(debit, credit);
  }
  return sub(credit, debit);
}

export async function fetchPostedLines(
  companyId: string,
  range: { start: Date; end: Date },
) {
  return prisma.journalLine.findMany({
    where: {
      journalEntry: {
        companyId,
        status: "POSTED",
        entryDate: { gte: range.start, lte: range.end },
      },
    },
    include: {
      glAccount: true,
      journalEntry: { select: { entryNo: true, entryDate: true, description: true } },
    },
    orderBy: [{ journalEntry: { entryDate: "asc" } }, { id: "asc" }],
  });
}

export async function fetchPostedLinesThrough(
  companyId: string,
  asOfEnd: Date,
) {
  return prisma.journalLine.findMany({
    where: {
      journalEntry: {
        companyId,
        status: "POSTED",
        entryDate: { lte: asOfEnd },
      },
    },
    include: { glAccount: true },
  });
}

export type LedgerRow = {
  entryNo: string;
  entryDate: Date;
  entryDescription: string | null;
  accountCode: string;
  accountName: string;
  debit: string;
  credit: string;
  memo: string | null;
};

export async function getGeneralLedger(
  companyId: string,
  range: { start: Date; end: Date },
  glAccountId?: string,
): Promise<LedgerRow[]> {
  const lines = await prisma.journalLine.findMany({
    where: {
      glAccountId: glAccountId ?? undefined,
      journalEntry: {
        companyId,
        status: "POSTED",
        entryDate: { gte: range.start, lte: range.end },
      },
    },
    include: {
      glAccount: true,
      journalEntry: { select: { entryNo: true, entryDate: true, description: true } },
    },
    orderBy: [{ journalEntry: { entryDate: "asc" } }, { id: "asc" }],
  });

  return lines.map((l) => ({
    entryNo: l.journalEntry.entryNo,
    entryDate: l.journalEntry.entryDate,
    entryDescription: l.journalEntry.description,
    accountCode: l.glAccount.code,
    accountName: l.glAccount.name,
    debit: l.debit.toFixed(2),
    credit: l.credit.toFixed(2),
    memo: l.memo,
  }));
}

export type TrialBalanceRow = {
  code: string;
  name: string;
  type: GlAccountType;
  debit: string;
  credit: string;
  balance: string;
};

export async function getTrialBalance(
  companyId: string,
  range: { start: Date; end: Date },
): Promise<TrialBalanceRow[]> {
  const lines = await fetchPostedLines(companyId, range);
  const byAccount = new Map<
    string,
    { account: { code: string; name: string; type: GlAccountType }; debit: Prisma.Decimal; credit: Prisma.Decimal }
  >();

  for (const l of lines) {
    const id = l.glAccountId;
    const cur = byAccount.get(id) ?? {
      account: {
        code: l.glAccount.code,
        name: l.glAccount.name,
        type: l.glAccount.type,
      },
      debit: d(0),
      credit: d(0),
    };
    cur.debit = add(cur.debit, l.debit);
    cur.credit = add(cur.credit, l.credit);
    byAccount.set(id, cur);
  }

  return [...byAccount.values()]
    .sort((a, b) => a.account.code.localeCompare(b.account.code))
    .map((row) => {
      const bal = lineBalanceForType(row.account.type, row.debit, row.credit);
      return {
        code: row.account.code,
        name: row.account.name,
        type: row.account.type,
        debit: row.debit.toFixed(2),
        credit: row.credit.toFixed(2),
        balance: bal.toFixed(2),
      };
    });
}

export type PLRow = { code: string; name: string; amount: string };

export async function getProfitAndLoss(
  companyId: string,
  range: { start: Date; end: Date },
): Promise<{ revenue: PLRow[]; expense: PLRow[]; netIncome: string }> {
  const lines = await fetchPostedLines(companyId, range);
  const map = new Map<string, { code: string; name: string; type: GlAccountType; net: Prisma.Decimal }>();

  for (const l of lines) {
    const t = l.glAccount.type;
    if (t !== "REVENUE" && t !== "EXPENSE") continue;
    const id = l.glAccountId;
    const cur = map.get(id) ?? {
      code: l.glAccount.code,
      name: l.glAccount.name,
      type: t,
      net: d(0),
    };
    if (t === "REVENUE") {
      cur.net = add(cur.net, sub(l.credit, l.debit));
    } else {
      cur.net = add(cur.net, sub(l.debit, l.credit));
    }
    map.set(id, cur);
  }

  const revenue: PLRow[] = [];
  const expense: PLRow[] = [];
  for (const v of [...map.values()].sort((a, b) => a.code.localeCompare(b.code))) {
    if (v.type === "REVENUE") revenue.push({ code: v.code, name: v.name, amount: v.net.toFixed(2) });
    else expense.push({ code: v.code, name: v.name, amount: v.net.toFixed(2) });
  }

  const totalRev = revenue.reduce((s, r) => add(s, d(r.amount)), d(0));
  const totalExp = expense.reduce((s, r) => add(s, d(r.amount)), d(0));
  const net = sub(totalRev, totalExp);

  return { revenue, expense, netIncome: net.toFixed(2) };
}

export type BSRow = { code: string; name: string; balance: string };

export async function getBalanceSheet(
  companyId: string,
  asOf: Date,
): Promise<{
  assets: BSRow[];
  liabilities: BSRow[];
  equity: BSRow[];
  retainedEarnings: string;
  totalAssets: string;
  totalLiabilities: string;
  totalLiabEq: string;
}> {
  const lines = await fetchPostedLinesThrough(companyId, asOf);
  const byAccount = new Map<
    string,
    { code: string; name: string; type: GlAccountType; debit: Prisma.Decimal; credit: Prisma.Decimal }
  >();

  for (const l of lines) {
    const id = l.glAccountId;
    const cur = byAccount.get(id) ?? {
      code: l.glAccount.code,
      name: l.glAccount.name,
      type: l.glAccount.type,
      debit: d(0),
      credit: d(0),
    };
    cur.debit = add(cur.debit, l.debit);
    cur.credit = add(cur.credit, l.credit);
    byAccount.set(id, cur);
  }

  const assets: BSRow[] = [];
  const liabilities: BSRow[] = [];
  const equity: BSRow[] = [];
  let cumulativePL = d(0);

  for (const row of [...byAccount.values()].sort((a, b) => a.code.localeCompare(b.code))) {
    const bal = lineBalanceForType(row.type, row.debit, row.credit);
    if (row.type === "ASSET") {
      assets.push({ code: row.code, name: row.name, balance: bal.toFixed(2) });
    } else if (row.type === "LIABILITY") {
      liabilities.push({ code: row.code, name: row.name, balance: bal.toFixed(2) });
    } else if (row.type === "EQUITY") {
      equity.push({ code: row.code, name: row.name, balance: bal.toFixed(2) });
    } else if (row.type === "REVENUE") {
      cumulativePL = add(cumulativePL, sub(row.credit, row.debit));
    } else if (row.type === "EXPENSE") {
      cumulativePL = sub(cumulativePL, sub(row.debit, row.credit));
    }
  }

  const totalAssets = assets.reduce((s, r) => add(s, d(r.balance)), d(0));
  const totalLiab = liabilities.reduce((s, r) => add(s, d(r.balance)), d(0));
  const totalEqGl = equity.reduce((s, r) => add(s, d(r.balance)), d(0));
  const totalLiabEq = add(add(totalLiab, totalEqGl), cumulativePL);

  return {
    assets,
    liabilities,
    equity,
    retainedEarnings: cumulativePL.toFixed(2),
    totalAssets: totalAssets.toFixed(2),
    totalLiabilities: totalLiab.toFixed(2),
    totalLiabEq: totalLiabEq.toFixed(2),
  };
}
