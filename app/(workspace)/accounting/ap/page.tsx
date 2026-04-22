import Link from "next/link";
import { getDefaultCompanyId } from "@/lib/company";
import { createPayable } from "@/lib/server/actions";
import { loadUnifiedAccountsPayable } from "@/lib/finance/unified-accounts-payable";
import { cn } from "@/lib/utils";

const statusLabel: Record<string, string> = {
  OPEN: "未付",
  PARTIAL: "部分付款",
  CLOSED: "已結清",
};

export default async function AccountsPayablePage() {
  const companyId = await getDefaultCompanyId();
  const rows = await loadUnifiedAccountsPayable(companyId);

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">應付帳款管理</h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          與<strong className="font-medium text-zinc-800 dark:text-zinc-200">請款單</strong>
          同步：狀態為「待審批 / 已通過」的請款單列為<strong>未付應付</strong>；標記「已支付」後視為
          <strong>已結清</strong>。草稿與已駁回請款不計入此臺帳。下方仍可手動登記供應商應付。
        </p>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold">手動登記應付（供應商帳單等）</h3>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          與請款單無關的供應商發票/帳單請在此登記。
        </p>
        <form action={createPayable} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <input
              name="vendorName"
              placeholder="供應商名稱"
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-zinc-600 dark:bg-zinc-950"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <input
              name="customerId"
              placeholder="關聯客戶檔案 ID（選填，與資料庫 Customer.id 一致）"
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-zinc-600 dark:bg-zinc-950"
            />
          </div>
          <input
            name="amount"
            placeholder="應付金額"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm tabular-nums shadow-sm dark:border-zinc-600 dark:bg-zinc-950"
            required
          />
          <input
            name="billNo"
            placeholder="帳單號"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
          <input
            name="dueDate"
            type="date"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
          <input
            name="description"
            placeholder="說明"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-zinc-600 dark:bg-zinc-950 sm:col-span-2"
          />
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              儲存
            </button>
          </div>
        </form>
      </section>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 bg-zinc-50/90 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">應付臺帳</h3>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            共 {rows.length} 筆 · 含請款單衍生列時，請在
            <Link href="/financial/payment-requests" className="mx-1 text-blue-600 underline dark:text-blue-400">
              請款單管理
            </Link>
            更新審批/支付狀態
          </p>
        </div>
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">來源</th>
              <th className="px-4 py-3">供應商 / 摘要</th>
              <th className="px-4 py-3 text-right">應付</th>
              <th className="px-4 py-3 text-right">已付</th>
              <th className="px-4 py-3 text-right">未付</th>
              <th className="px-4 py-3">狀態</th>
              <th className="px-4 py-3">立帳日</th>
              <th className="px-4 py-3">到期</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  暫無應付。請登記供應商帳單，或於請款單提交/通過後將自動出現在此。
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const outstanding = r.amount - r.paidAmount;
                return (
                  <tr
                    key={r.id}
                    className="border-b border-zinc-100 transition-colors hover:bg-zinc-50/80 dark:border-zinc-800 dark:hover:bg-zinc-900/40"
                  >
                    <td className="px-4 py-2 align-top">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                          r.source === "PAYMENT_REQUEST"
                            ? "bg-violet-100 text-violet-900 dark:bg-violet-950/50 dark:text-violet-200"
                            : "bg-zinc-200/90 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200"
                        )}
                      >
                        {r.source === "PAYMENT_REQUEST" ? "請款單" : "手動"}
                      </span>
                    </td>
                    <td className="px-4 py-2 align-top">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">{r.vendorName}</div>
                      <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        {[r.billNo, r.description].filter(Boolean).join(" · ") || "—"}
                      </div>
                      {r.source === "PAYMENT_REQUEST" && (r.department || r.requestedBy) ? (
                        <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {[r.department, r.requestedBy].filter(Boolean).join(" · ")}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-zinc-800 dark:text-zinc-200">
                      {r.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-emerald-700 dark:text-emerald-400/90">
                      {r.paidAmount.toFixed(2)}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-2 text-right text-sm font-medium tabular-nums",
                        outstanding > 0.005
                          ? "text-orange-700 dark:text-orange-400"
                          : "text-zinc-500 dark:text-zinc-400"
                      )}
                    >
                      {outstanding.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 align-top">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                          r.status === "OPEN"
                            ? "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200"
                            : r.status === "PARTIAL"
                              ? "bg-sky-100 text-sky-900 dark:bg-sky-950/50 dark:text-sky-200"
                              : "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
                        )}
                      >
                        {statusLabel[r.status] ?? r.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 align-top text-zinc-600 tabular-nums dark:text-zinc-400">
                      {r.issueDate.toLocaleDateString("zh-CN")}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 align-top text-zinc-600 dark:text-zinc-400">
                      {r.dueDate ? r.dueDate.toLocaleDateString("zh-CN") : "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
