import { prisma } from "@/lib/prisma";
import { getDefaultCompanyId } from "@/lib/company";
import { stripPaymentRequestSeedTitleSuffix } from "@/lib/finance/unified-accounts-payable";
import { formatZhDateWithYear } from "@/lib/format-date";
import { createPaymentRequest, paymentRequestDecisionForm } from "@/lib/server/actions";

const statusLabel: Record<string, string> = {
  DRAFT: "草稿",
  SUBMITTED: "待審批",
  APPROVED: "已通過",
  REJECTED: "已駁回",
  PAID: "已支付",
};

export default async function PaymentRequestsPage() {
  const companyId = await getDefaultCompanyId();
  const rows = await prisma.paymentRequest.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">請款單管理</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          管理請款單及預收款項，處理每一筆進出的錢。
        </p>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold">新建請款單 (Expense Request Form)</h3>
        <form action={createPaymentRequest} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            name="department"
            placeholder="所屬部門 (如：市場部)"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 sm:col-span-2"
            required
          />
          <select
            name="category"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            required
          >
            <option value="">選擇費用類別</option>
            <option value="文具">文具</option>
            <option value="餐費">餐費</option>
            <option value="物流">物流</option>
            <option value="差旅">差旅</option>
            <option value="其他">其他</option>
          </select>
          <input
            name="amount"
            type="number"
            step="0.01"
            placeholder="金額"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm tabular-nums dark:border-zinc-600 dark:bg-zinc-950"
            required
          />
          <input
            name="title"
            placeholder="請款標題"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 sm:col-span-2"
            required
          />
          <input
            name="purpose"
            placeholder="備註說明"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 sm:col-span-2"
          />
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">附件上傳 (收據/發票照片)</label>
            <input
              type="file"
              name="attachment"
              className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200 dark:file:bg-zinc-800 dark:file:text-zinc-300"
            />
          </div>
          <input type="hidden" name="approverRole" value="finance_manager" />
          
          <div className="sm:col-span-2 flex gap-3 mt-2">
            <button
              type="submit"
              name="action"
              value="submit"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              提交審核
            </button>
            <button
              type="submit"
              name="action"
              value="draft"
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              保存草稿
            </button>
          </div>
        </form>
      </section>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">部門</th>
              <th className="px-4 py-3">費用類別</th>
              <th className="px-4 py-3">標題 / 備註</th>
              <th className="px-4 py-3 text-right">金額</th>
              <th className="px-4 py-3">狀態標籤</th>
              <th className="px-4 py-3">日期</th>
              <th className="px-4 py-3">審批操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="px-4 py-2 font-medium">{r.department ?? "—"}</td>
                <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">{r.category ?? "—"}</td>
                <td className="px-4 py-2">
                  <div className="font-medium">{stripPaymentRequestSeedTitleSuffix(r.title)}</div>
                  <div className="text-xs text-zinc-500">{r.purpose ?? "—"}</div>
                </td>
                <td className="px-4 py-2 text-right tabular-nums font-medium">${r.amount.toFixed(2)}</td>
                <td className="px-4 py-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    r.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    r.status === 'REJECTED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                    r.status === 'PAID' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    r.status === 'DRAFT' ? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400' :
                    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}>
                    {statusLabel[r.status] ?? r.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-zinc-600 tabular-nums dark:text-zinc-400">
                  {formatZhDateWithYear(r.createdAt)}
                </td>
                <td className="px-4 py-2">
                  {r.status === "SUBMITTED" ? (
                    <div className="flex flex-wrap gap-2">
                      <form action={paymentRequestDecisionForm}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="decision" value="APPROVED" />
                        <button type="submit" className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
                          准予報銷
                        </button>
                      </form>
                      <form action={paymentRequestDecisionForm}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="decision" value="REJECTED" />
                        <button type="submit" className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400">
                          駁回
                        </button>
                      </form>
                    </div>
                  ) : r.status === "APPROVED" ? (
                    <form action={paymentRequestDecisionForm}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="decision" value="PAID" />
                      <button type="submit" className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
                        標記已支付
                      </button>
                    </form>
                  ) : (
                    <span className="text-xs text-zinc-400">—</span>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-zinc-500">
                  暫無請款單數據
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
