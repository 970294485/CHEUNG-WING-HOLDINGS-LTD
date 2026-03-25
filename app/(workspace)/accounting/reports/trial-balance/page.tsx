import { getDefaultCompanyId } from "@/lib/company";
import { getTrialBalance } from "@/lib/finance/reports";

function monthRange(y: number, m: number) {
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0, 23, 59, 59);
  return { start, end };
}

const typeLabel: Record<string, string> = {
  ASSET: "資產",
  LIABILITY: "負債",
  EQUITY: "權益",
  REVENUE: "收入",
  EXPENSE: "費用",
};

export default async function TrialBalancePage({
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
  const rows = await getTrialBalance(companyId, { start, end });

  let tdebit = 0;
  let tcredit = 0;
  for (const r of rows) {
    tdebit += Number(r.debit);
    tcredit += Number(r.credit);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">試算平衡表</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">按期間彙總已過帳分錄。</p>
      </div>

      <form
        method="get"
        action="/accounting/reports/trial-balance"
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

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">代碼</th>
              <th className="px-4 py-3">科目</th>
              <th className="px-4 py-3">類型</th>
              <th className="px-4 py-3 text-right">借方</th>
              <th className="px-4 py-3 text-right">貸方</th>
              <th className="px-4 py-3 text-right">餘額</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.code} className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="px-4 py-2 font-mono">{r.code}</td>
                <td className="px-4 py-2">{r.name}</td>
                <td className="px-4 py-2">{typeLabel[r.type] ?? r.type}</td>
                <td className="px-4 py-2 text-right tabular-nums">{r.debit}</td>
                <td className="px-4 py-2 text-right tabular-nums">{r.credit}</td>
                <td className="px-4 py-2 text-right tabular-nums">{r.balance}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-zinc-200 bg-zinc-50 font-medium dark:border-zinc-800 dark:bg-zinc-950">
            <tr>
              <td colSpan={3} className="px-4 py-3">
                合計
              </td>
              <td className="px-4 py-3 text-right tabular-nums">{tdebit.toFixed(2)}</td>
              <td className="px-4 py-3 text-right tabular-nums">{tcredit.toFixed(2)}</td>
              <td className="px-4 py-3" />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
