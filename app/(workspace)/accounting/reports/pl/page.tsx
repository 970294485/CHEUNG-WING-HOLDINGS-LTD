import { getDefaultCompanyId } from "@/lib/company";
import { getProfitAndLoss } from "@/lib/finance/reports";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

function monthRange(y: number, m: number) {
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0, 23, 59, 59);
  return { start, end };
}

export default async function ProfitLossPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string; m?: string }>;
}) {
  const sp = await searchParams;
  const companyId = await getDefaultCompanyId();
  const now = new Date();
  const y = Number.parseInt(sp.y ?? String(now.getFullYear()), 10);
  const mo = Number.parseInt(sp.m ?? String(now.getMonth() + 1), 10);
  const { start, end } = monthRange(y, mo);
  const pl = await getProfitAndLoss(companyId, { start, end });

  const budgets = await prisma.budgetLine.findMany({
    where: { companyId, year: y, month: mo },
    include: { glAccount: true },
  });
  const revBud = budgets.filter((b) => b.budgetType === "REVENUE");
  const expBud = budgets.filter((b) => b.budgetType === "EXPENSE");
  const totalRevBud = revBud.reduce((s, b) => s.add(b.amount), new Prisma.Decimal(0));
  const totalExpBud = expBud.reduce((s, b) => s.add(b.amount), new Prisma.Decimal(0));

  const actualRev = pl.revenue.reduce((s, r) => s + Number(r.amount), 0);
  const actualExp = pl.expense.reduce((s, r) => s + Number(r.amount), 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">損益表</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">期間收入與費用；可對比月度預算。</p>
      </div>

      <form
        method="get"
        action="/accounting/reports/pl"
        className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <label className="text-sm">
          年
          <input
            name="y"
            type="number"
            defaultValue={y}
            className="mt-1 ml-2 w-24 rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
        </label>
        <label className="text-sm">
          月
          <input
            name="m"
            type="number"
            min={1}
            max={12}
            defaultValue={mo}
            className="mt-1 ml-2 w-20 rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          查詢
        </button>
      </form>

      {revBud.length + expBud.length > 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="font-semibold text-zinc-800 dark:text-zinc-200">預算對比（本月）</h3>
          <dl className="mt-2 grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-zinc-500">收入預算 / 實際</dt>
              <dd className="font-medium tabular-nums">
                {totalRevBud.toFixed(2)} / {actualRev.toFixed(2)}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">費用預算 / 實際</dt>
              <dd className="font-medium tabular-nums">
                {totalExpBud.toFixed(2)} / {actualExp.toFixed(2)}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">收入</h3>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {pl.revenue.map((r) => (
                <tr key={r.code} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="py-2">
                    {r.code} {r.name}
                  </td>
                  <td className="py-2 text-right tabular-nums">{r.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {pl.revenue.length === 0 ? <p className="mt-2 text-sm text-zinc-500">無收入發生額</p> : null}
        </section>
        <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-rose-800 dark:text-rose-200">費用</h3>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {pl.expense.map((r) => (
                <tr key={r.code} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="py-2">
                    {r.code} {r.name}
                  </td>
                  <td className="py-2 text-right tabular-nums">{r.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {pl.expense.length === 0 ? <p className="mt-2 text-sm text-zinc-500">無費用發生額</p> : null}
        </section>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-white dark:border-zinc-700 dark:bg-zinc-950">
        <div className="text-sm text-zinc-400">本期淨利（收入 − 費用）</div>
        <div className="mt-1 text-2xl font-semibold tabular-nums">{pl.netIncome}</div>
      </div>
    </div>
  );
}
