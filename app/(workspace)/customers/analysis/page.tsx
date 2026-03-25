import { prisma } from "@/lib/prisma";
import { getDefaultCompanyId } from "@/lib/company";

export default async function CustomerAnalysisPage() {
  const companyId = await getDefaultCompanyId();

  // Mock data for customer analysis
  const customerSources = [
    { source: "展會 (Exhibition)", count: 45, percentage: 35 },
    { source: "官網 (Website)", count: 32, percentage: 25 },
    { source: "老客戶推薦 (Referral)", count: 28, percentage: 22 },
    { source: "社交媒體 (Social Media)", count: 15, percentage: 12 },
    { source: "其他 (Others)", count: 8, percentage: 6 },
  ];

  const conversionRates = [
    { stage: "潛在客戶 (Leads)", count: 128, rate: "100%" },
    { stage: "已聯繫 (Contacted)", count: 85, rate: "66.4%" },
    { stage: "已報價 (Quoted)", count: 42, rate: "32.8%" },
    { stage: "已成交 (Won)", count: 18, rate: "14.1%" },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">客戶分析 (Customer Analysis)</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          客戶來源分佈與轉化率漏斗分析。
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer Sources */}
        <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold mb-4">客戶來源分佈</h3>
          <div className="space-y-4">
            {customerSources.map((item) => (
              <div key={item.source}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">{item.source}</span>
                  <span className="text-zinc-500">{item.count} 人 ({item.percentage}%)</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Conversion Funnel */}
        <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold mb-4">銷售漏斗轉化率</h3>
          <div className="space-y-4">
            {conversionRates.map((item, index) => {
              const width = `${100 - index * 20}%`; // Mock visual funnel width
              return (
                <div key={item.stage} className="flex flex-col items-center">
                  <div 
                    className="flex items-center justify-between px-4 py-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 rounded-md border border-indigo-100 dark:border-indigo-900/50"
                    style={{ width }}
                  >
                    <span className="text-sm font-medium">{item.stage}</span>
                    <span className="text-sm font-bold">{item.count}</span>
                  </div>
                  {index < conversionRates.length - 1 && (
                    <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700 my-1"></div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
