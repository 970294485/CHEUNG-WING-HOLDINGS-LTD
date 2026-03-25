import { prisma } from "@/lib/prisma";
import { getDefaultCompanyId } from "@/lib/company";
import { getGeneralLedger } from "@/lib/finance/reports";

function monthRange(y: number, m: number) {
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0, 23, 59, 59);
  return { start, end };
}

export default async function LedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string; m?: string; account?: string }>;
}) {
  const sp = await searchParams;
  const companyId = await getDefaultCompanyId();
  const now = new Date();
  const y = Number.parseInt(sp.y ?? String(now.getFullYear()), 10);
  const m = Number.parseInt(sp.m ?? String(now.getMonth() + 1), 10);
  const { start, end } = monthRange(y, m);
  const accountId = sp.account && sp.account !== "all" ? sp.account : undefined;

  const [accounts, rows] = await Promise.all([
    prisma.glAccount.findMany({
      where: { companyId, isActive: true },
      orderBy: { code: "asc" },
    }),
    getGeneralLedger(companyId, { start, end }, accountId),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">總帳明細</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">已過帳憑證分錄行，按期間篩選。</p>
      </div>

      <form
        method="get"
        action="/accounting/ledger"
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
          <span className="text-zinc-500">科目</span>
          <select
            name="account"
            defaultValue={accountId ?? "all"}
            className="mt-1 min-w-[200px] rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          >
            <option value="all">全部</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} {a.name}
              </option>
            ))}
          </select>
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
              <th className="px-4 py-3">憑證</th>
              <th className="px-4 py-3">日期</th>
              <th className="px-4 py-3">科目</th>
              <th className="px-4 py-3 text-right">借方</th>
              <th className="px-4 py-3 text-right">貸方</th>
              <th className="px-4 py-3">備註</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={idx} className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="px-4 py-2 font-mono text-xs">{r.entryNo}</td>
                <td className="px-4 py-2">{r.entryDate.toLocaleDateString("zh-CN")}</td>
                <td className="px-4 py-2">
                  {r.accountCode} {r.accountName}
                </td>
                <td className="px-4 py-2 text-right tabular-nums">{r.debit}</td>
                <td className="px-4 py-2 text-right tabular-nums">{r.credit}</td>
                <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">{r.memo ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <p className="p-6 text-center text-sm text-zinc-500">該期間無已過帳分錄。</p>
        ) : null}
      </div>
    </div>
  );
}
