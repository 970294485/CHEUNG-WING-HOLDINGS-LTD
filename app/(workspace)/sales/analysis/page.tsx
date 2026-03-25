import { prisma } from "@/lib/prisma";
import { getDefaultCompanyId } from "@/lib/company";

export default async function SalesAnalysisPage() {
  const companyId = await getDefaultCompanyId();

  // Mock data for sales analysis
  const monthlySales = [
    { month: "1月", revenue: 120000, target: 100000 },
    { month: "2月", revenue: 95000, target: 100000 },
    { month: "3月", revenue: 145000, target: 120000 },
    { month: "4月", revenue: 110000, target: 120000 },
    { month: "5月", revenue: 160000, target: 150000 },
    { month: "6月", revenue: 185000, target: 150000 },
  ];

  const topProducts = [
    { name: "工業級伺服馬達 (SM-2000)", sales: 450, revenue: 85000 },
    { name: "精密減速機 (GR-50)", sales: 320, revenue: 64000 },
    { name: "PLC 控制器 (C-100)", sales: 280, revenue: 42000 },
    { name: "變頻器 (VFD-X)", sales: 150, revenue: 30000 },
    { name: "人機介面 (HMI-7)", sales: 120, revenue: 18000 },
  ];

  const totalRevenue = monthlySales.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalTarget = monthlySales.reduce((acc, curr) => acc + curr.target, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">銷售分析報告 (Sales Analysis)</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          銷售業績趨勢與熱銷產品排行。
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-500">總銷售額 (上半年度)</h3>
          <p className="mt-2 text-3xl font-bold tracking-tight">${totalRevenue.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-500">目標達成率</h3>
          <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {((totalRevenue / totalTarget) * 100).toFixed(1)}%
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-500">平均客單價</h3>
          <p className="mt-2 text-3xl font-bold tracking-tight">
            ${(totalRevenue / 128).toFixed(0)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Sales Trend */}
        <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold mb-4">月度業績趨勢</h3>
          <div className="space-y-4">
            {monthlySales.map((item) => (
              <div key={item.month}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">{item.month}</span>
                  <span className="text-zinc-500">
                    ${item.revenue.toLocaleString()} / ${item.target.toLocaleString()}
                  </span>
                </div>
                <div className="flex h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-full bg-emerald-500 rounded-l-full"
                    style={{ width: `${Math.min((item.revenue / item.target) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Top Products */}
        <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold mb-4">熱銷產品排行 (Top 5)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                <tr>
                  <th className="pb-2 font-medium">產品名稱</th>
                  <th className="pb-2 font-medium text-right">銷量</th>
                  <th className="pb-2 font-medium text-right">銷售額</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {topProducts.map((product) => (
                  <tr key={product.name}>
                    <td className="py-3 font-medium text-zinc-800 dark:text-zinc-200">{product.name}</td>
                    <td className="py-3 text-right text-zinc-600 dark:text-zinc-400">{product.sales}</td>
                    <td className="py-3 text-right text-zinc-600 dark:text-zinc-400">${product.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
