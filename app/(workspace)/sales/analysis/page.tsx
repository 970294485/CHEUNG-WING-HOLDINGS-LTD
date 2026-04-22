import Link from "next/link";
import { getDefaultCompanyId } from "@/lib/company";
import { getSalesYearAnalytics } from "@/lib/server/sales-customer-analytics";

function fmtMoney(n: number) {
  return `¥${n.toLocaleString("zh-CN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export default async function SalesAnalysisPage() {
  const companyId = await getDefaultCompanyId();
  const year = new Date().getFullYear();
  const data = await getSalesYearAnalytics(companyId, year);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">銷售分析報告 (Sales Analysis)</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            基於報價單、合同、預收發票（不含已取消），{year} 日曆年彙總。
          </p>
        </div>
        <Link
          href="/customers/analysis"
          className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          客戶分析 →
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-500">本年銷售單據總額</h3>
          <p className="mt-2 text-3xl font-bold tracking-tight">{fmtMoney(data.totalDocAmount)}</p>
          <p className="mt-1 text-xs text-zinc-500">{data.docCount} 筆單據</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-500">合同成交額</h3>
          <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {fmtMoney(data.contractWon)}
          </p>
          <p className="mt-1 text-xs text-zinc-500">已確認 / 已完成合同</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-500">平均客單價</h3>
          <p className="mt-2 text-3xl font-bold tracking-tight">
            {data.docCount > 0 ? fmtMoney(data.avgTicket) : "—"}
          </p>
          <p className="mt-1 text-xs text-zinc-500">總額 ÷ 單據筆數</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold mb-1">月度單據金額</h3>
          <p className="mb-4 text-xs text-zinc-500">柱長為當年內相對最高月份的占比</p>
          <div className="space-y-4">
            {data.monthly.every((x) => x.revenue === 0) ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {year} 年暫無有效銷售單據，請在報價/合同模塊建立資料。
              </p>
            ) : (
              data.monthly.map((item) => (
                <div key={item.month}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{item.month}</span>
                    <span className="text-zinc-500">{fmtMoney(item.revenue)}</span>
                  </div>
                  <div className="flex h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className="h-full bg-emerald-500 rounded-l-full transition-all"
                      style={{ width: `${item.barPct}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold mb-1">產品金額排行 (Top 5)</h3>
          <p className="mb-4 text-xs text-zinc-500">按明細行「小計」彙總，數量為銷售件數</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                <tr>
                  <th className="pb-2 font-medium">產品</th>
                  <th className="pb-2 font-medium text-right">數量</th>
                  <th className="pb-2 font-medium text-right">金額</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {data.topProducts.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                      本年暫無帶明細的銷售單據。
                    </td>
                  </tr>
                ) : (
                  data.topProducts.map((product) => (
                    <tr key={product.name}>
                      <td className="py-3 font-medium text-zinc-800 dark:text-zinc-200">{product.name}</td>
                      <td className="py-3 text-right text-zinc-600 dark:text-zinc-400">{product.sales}</td>
                      <td className="py-3 text-right text-zinc-600 dark:text-zinc-400">
                        {fmtMoney(product.revenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
