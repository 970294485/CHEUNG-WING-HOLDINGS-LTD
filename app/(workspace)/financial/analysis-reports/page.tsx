import { prisma } from "@/lib/prisma";
import { getDefaultCompanyId } from "@/lib/company";

export default async function AnalysisReportsPage() {
  const companyId = await getDefaultCompanyId();

  // Mock data for charts and tables
  const monthlyData = [
    { month: "10月", revenue: 125000, expense: 98000 },
    { month: "11月", revenue: 142000, expense: 105000 },
    { month: "12月", revenue: 168000, expense: 112000 },
    { month: "1月", revenue: 135000, expense: 120000 },
    { month: "2月", revenue: 150000, expense: 115000 },
    { month: "3月", revenue: 180000, expense: 130000 },
  ];

  const summaryData = [
    { department: "市場部", project: "Q1 推廣", income: 0, expense: 45000, date: "2026-03-15" },
    { department: "研發部", project: "新產品研發", income: 0, expense: 65000, date: "2026-03-10" },
    { department: "行政部", project: "日常運營", income: 0, expense: 15000, date: "2026-03-05" },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">財務分析報告 (Reporting)</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            管理層的決策看板，掌握公司收支與現金流狀況。
          </p>
        </div>
        <div className="flex gap-3">
          <button className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900">
            導出 PDF 報表
          </button>
          <button className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
            一鍵發送至老闆 Email
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-500">本月實際收入</h3>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight">$180,000</span>
            <span className="text-sm font-medium text-emerald-600">+20%</span>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-500">本月實際支出</h3>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight">$130,000</span>
            <span className="text-sm font-medium text-red-600">+13%</span>
          </div>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/30">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-300">下月現金流預警</h3>
          <div className="mt-2 text-sm text-red-700 dark:text-red-400">
            預計下月固定支出 <strong>$145,000</strong>，當前應收賬款 <strong>$80,000</strong>。
            <div className="mt-1 font-medium">預計資金缺口: $65,000</div>
          </div>
        </div>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold mb-6">收支對照 (近6個月)</h3>
        <div className="h-64 flex items-end gap-2 sm:gap-6 justify-between pt-4">
          {monthlyData.map((d, i) => {
            const maxVal = 200000;
            const revHeight = (d.revenue / maxVal) * 100;
            const expHeight = (d.expense / maxVal) * 100;
            
            return (
              <div key={i} className="flex flex-col items-center flex-1 group">
                <div className="flex items-end gap-1 w-full justify-center h-48 mb-2">
                  <div 
                    className="w-1/3 max-w-[2rem] bg-emerald-400 dark:bg-emerald-500 rounded-t-sm relative"
                    style={{ height: `${revHeight}%` }}
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap pointer-events-none transition-opacity">
                      收入: ${d.revenue / 1000}k
                    </div>
                  </div>
                  <div 
                    className="w-1/3 max-w-[2rem] bg-red-400 dark:bg-red-500 rounded-t-sm relative"
                    style={{ height: `${expHeight}%` }}
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap pointer-events-none transition-opacity">
                      支出: ${d.expense / 1000}k
                    </div>
                  </div>
                </div>
                <span className="text-xs text-zinc-500">{d.month}</span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-400 dark:bg-emerald-500 rounded-sm"></div>
            <span className="text-zinc-600 dark:text-zinc-400">實際收入</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-400 dark:bg-red-500 rounded-sm"></div>
            <span className="text-zinc-600 dark:text-zinc-400">實際支出</span>
          </div>
        </div>
      </section>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950">
          <h3 className="text-sm font-semibold">多維彙總表</h3>
          <div className="flex gap-2">
            <select className="rounded-md border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-900">
              <option>所有部門</option>
              <option>市場部</option>
              <option>銷售部</option>
              <option>研發部</option>
            </select>
            <select className="rounded-md border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-900">
              <option>本月</option>
              <option>上月</option>
              <option>本季度</option>
            </select>
          </div>
        </div>
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">日期</th>
              <th className="px-4 py-3">部門</th>
              <th className="px-4 py-3">項目</th>
              <th className="px-4 py-3 text-right">收入</th>
              <th className="px-4 py-3 text-right">支出</th>
              <th className="px-4 py-3 text-right">淨額</th>
            </tr>
          </thead>
          <tbody>
            {summaryData.map((d, i) => (
              <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">{d.date}</td>
                <td className="px-4 py-2 font-medium">{d.department}</td>
                <td className="px-4 py-2">{d.project}</td>
                <td className="px-4 py-2 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                  {d.income > 0 ? `+$${d.income.toLocaleString()}` : '—'}
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-red-600 dark:text-red-400">
                  {d.expense > 0 ? `-$${d.expense.toLocaleString()}` : '—'}
                </td>
                <td className="px-4 py-2 text-right tabular-nums font-medium">
                  ${(d.income - d.expense).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
