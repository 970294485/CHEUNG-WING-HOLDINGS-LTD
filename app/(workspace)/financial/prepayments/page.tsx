import { prisma } from "@/lib/prisma";
import { getDefaultCompanyId } from "@/lib/company";
import { createPrepayment } from "@/lib/server/actions";
import { PrintButton } from "@/components/print-button";

const statusLabel: Record<string, string> = {
  OPEN: "未核銷",
  PARTIALLY_APPLIED: "部分核銷",
  CLOSED: "已關閉",
};

export default async function PrepaymentsPage() {
  const companyId = await getDefaultCompanyId();
  const rows = await prisma.prepayment.findMany({
    where: { companyId },
    orderBy: { receivedAt: "desc" },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">預收款項管理</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          記錄預收並與合同/發票關聯，防止漏收或重複收款。
        </p>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold">預收款表單 (Pre-payment Form)</h3>
        <form action={createPrepayment} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <input
              name="payerName"
              placeholder="客戶名稱 (選填，若有關聯客戶則自動帶入)"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            />
          </div>
          <div className="flex flex-col gap-1">
            <input
              name="customerId"
              placeholder="客戶 ID (選填，用於關聯客戶檔案)"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            />
          </div>
          <input
            name="amount"
            type="number"
            step="0.01"
            placeholder="預收金額"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm tabular-nums dark:border-zinc-600 dark:bg-zinc-950"
            required
          />
          <input
            name="receivedAt"
            type="date"
            placeholder="收款日期"
            defaultValue={new Date().toISOString().split('T')[0]}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            required
          />
          <select
            name="reference"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            required
          >
            <option value="">選擇收款賬戶</option>
            <option value="滙豐銀行">滙豐銀行</option>
            <option value="花旗銀行">花旗銀行</option>
            <option value="支付寶">支付寶</option>
            <option value="微信支付">微信支付</option>
            <option value="現金">現金</option>
          </select>
          <input
            name="linkedDocumentId"
            placeholder="預計對應合同編號"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 sm:col-span-2"
          />
          <input type="hidden" name="linkedDocumentType" value="CONTRACT" />
          
          <div className="sm:col-span-2 flex gap-3 mt-2">
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              確認入賬
            </button>
            <PrintButton />
          </div>
        </form>
      </section>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">收款日期</th>
              <th className="px-4 py-3">客戶名稱</th>
              <th className="px-4 py-3">收款賬戶</th>
              <th className="px-4 py-3">對應合同</th>
              <th className="px-4 py-3 text-right">預收金額</th>
              <th className="px-4 py-3">狀態標籤</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                  {r.receivedAt.toLocaleDateString("zh-CN")}
                </td>
                <td className="px-4 py-2 font-medium">{r.payerName ?? "—"}</td>
                <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">{r.reference ?? "—"}</td>
                <td className="px-4 py-2 text-xs text-zinc-600 dark:text-zinc-400">
                  {r.linkedDocumentId ?? "—"}
                </td>
                <td className="px-4 py-2 text-right tabular-nums font-medium text-emerald-600 dark:text-emerald-400">
                  + ${r.amount.toFixed(2)}
                </td>
                <td className="px-4 py-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    r.status === 'OPEN' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                    r.status === 'PARTIALLY_APPLIED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}>
                    {statusLabel[r.status] ?? r.status}
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-zinc-500">
                  暫無預收款數據
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
