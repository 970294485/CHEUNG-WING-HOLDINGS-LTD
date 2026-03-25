import { prisma } from "@/lib/prisma";
import { getDefaultCompanyId } from "@/lib/company";

export default async function ContractInvoicePrepayPage() {
  const companyId = await getDefaultCompanyId();
  
  // Mock data for contracts and invoices matching
  const mockContracts = [
    {
      id: "C-202603-001",
      customerName: "Tech Corp",
      totalAmount: 15000.00,
      prepaidAmount: 5000.00,
      invoicedAmount: 0.00,
      remainingAmount: 10000.00,
      status: "待衝抵",
    },
    {
      id: "C-202603-002",
      customerName: "Global Trade Inc",
      totalAmount: 8500.00,
      prepaidAmount: 8500.00,
      invoicedAmount: 8500.00,
      remainingAmount: 0.00,
      status: "已結清",
    }
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">合同與發票預收對接 (Matching Logic)</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          防止漏收或重複收款，自動關聯預收款與合同/發票。
        </p>
      </div>

      {/* 自動關聯提示區塊 */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/30">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1 md:flex md:justify-between">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>自動關聯提示：</strong> 客戶 <strong>Tech Corp</strong> 尚有 <span className="font-bold">$5,000.00</span> 預收款未處理，是否衝抵當前待開發票？
            </p>
            <p className="mt-2 text-sm md:mt-0 md:ml-6">
              <button className="whitespace-nowrap font-medium text-blue-700 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300">
                立即處理 &rarr;
              </button>
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold mb-4">衝抵表單</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">發票總額</label>
              <div className="text-lg font-medium">$15,000.00</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">預收款可用餘額</label>
              <div className="text-lg font-medium text-emerald-600 dark:text-emerald-400">$5,000.00</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">本次衝抵金額 (可手動修改)</label>
              <input
                type="number"
                defaultValue="5000.00"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm tabular-nums dark:border-zinc-600 dark:bg-zinc-950"
              />
            </div>
            <div className="pt-2 flex gap-3">
              <button className="flex-1 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
                一鍵衝抵
              </button>
              <button className="flex-1 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900">
                生成差額髮票
              </button>
            </div>
          </div>
        </section>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="text-sm font-semibold">合同衝抵明細</h3>
        </div>
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">合同編號 / 客戶</th>
              <th className="px-4 py-3 text-right">合同總額</th>
              <th className="px-4 py-3 text-right">已收預付款</th>
              <th className="px-4 py-3 text-right">待開票金額</th>
              <th className="px-4 py-3 text-right">剩餘待收</th>
              <th className="px-4 py-3">狀態</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {mockContracts.map((c) => (
              <tr key={c.id} className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="px-4 py-2">
                  <div className="font-medium">{c.id}</div>
                  <div className="text-xs text-zinc-500">{c.customerName}</div>
                </td>
                <td className="px-4 py-2 text-right tabular-nums">${c.totalAmount.toFixed(2)}</td>
                <td className="px-4 py-2 text-right tabular-nums text-emerald-600 dark:text-emerald-400">${c.prepaidAmount.toFixed(2)}</td>
                <td className="px-4 py-2 text-right tabular-nums">${(c.totalAmount - c.invoicedAmount).toFixed(2)}</td>
                <td className="px-4 py-2 text-right tabular-nums font-medium text-red-600 dark:text-red-400">${c.remainingAmount.toFixed(2)}</td>
                <td className="px-4 py-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    c.status === '已結清' ? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400' :
                    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-2">
                  {c.status !== '已結清' && (
                    <button className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
                      處理衝抵
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
