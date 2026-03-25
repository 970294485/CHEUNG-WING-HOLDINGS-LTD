import { getDefaultCompanyId } from "@/lib/company";
import { getBalanceSheet } from "@/lib/finance/reports";

export default async function BalanceSheetPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string; m?: string; d?: string }>;
}) {
  const sp = await searchParams;
  const companyId = await getDefaultCompanyId();
  const now = new Date();
  const y = Number.parseInt(sp.y ?? String(now.getFullYear()), 10);
  const m = Number.parseInt(sp.m ?? String(now.getMonth() + 1), 10);
  const d = Number.parseInt(sp.d ?? String(now.getDate()), 10);
  const asOf = new Date(y, m - 1, d, 23, 59, 59);
  const bs = await getBalanceSheet(companyId, asOf);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">資產負債表</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          截至 {asOf.toLocaleDateString("zh-CN")} 的科目餘額；權益含累計損益（未單獨結帳時）。
        </p>
      </div>

      <form
        method="get"
        action="/accounting/reports/bs"
        className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <label className="text-sm">
          <span className="text-zinc-500">年</span>
          <input
            name="y"
            type="number"
            defaultValue={y}
            className="mt-1 w-24 rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
        </label>
        <label className="text-sm">
          <span className="text-zinc-500">月</span>
          <input
            name="m"
            type="number"
            min={1}
            max={12}
            defaultValue={m}
            className="mt-1 w-20 rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
        </label>
        <label className="text-sm">
          <span className="text-zinc-500">日</span>
          <input
            name="d"
            type="number"
            min={1}
            max={31}
            defaultValue={d}
            className="mt-1 w-20 rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          查詢
        </button>
      </form>

      <div className="grid gap-6 md:grid-cols-3">
        <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200">資產</h3>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {bs.assets.map((r) => (
                <tr key={r.code} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="py-2">
                    {r.code} {r.name}
                  </td>
                  <td className="py-2 text-right tabular-nums">{r.balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-sm font-medium">合計：{bs.totalAssets}</p>
        </section>
        <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">負債</h3>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {bs.liabilities.map((r) => (
                <tr key={r.code} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="py-2">
                    {r.code} {r.name}
                  </td>
                  <td className="py-2 text-right tabular-nums">{r.balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-violet-800 dark:text-violet-200">權益</h3>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {bs.equity.map((r) => (
                <tr key={r.code} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="py-2">
                    {r.code} {r.name}
                  </td>
                  <td className="py-2 text-right tabular-nums">{r.balance}</td>
                </tr>
              ))}
              <tr className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="py-2">累計損益（收入/費用軋差）</td>
                <td className="py-2 text-right tabular-nums">{bs.retainedEarnings}</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-3 text-xs text-zinc-500">
            負債與權益合計（含累計損益）參考：{bs.totalLiabEq}（應與資產合計 {bs.totalAssets} 一致）
          </p>
        </section>
      </div>
    </div>
  );
}
