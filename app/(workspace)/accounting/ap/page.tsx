import { prisma } from "@/lib/prisma";
import { getDefaultCompanyId } from "@/lib/company";
import { createPayable } from "@/lib/server/actions";

const statusLabel: Record<string, string> = {
  OPEN: "未付",
  PARTIAL: "部分付款",
  CLOSED: "已結清",
};

export default async function AccountsPayablePage() {
  const companyId = await getDefaultCompanyId();
  const rows = await prisma.accountsPayable.findMany({
    where: { companyId },
    orderBy: { issueDate: "desc" },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">應付帳款</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">應付臺帳；付款核銷可與請款、憑證後續聯動。</p>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold">登記應付</h3>
        <form action={createPayable} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <input
              name="vendorName"
              placeholder="供應商名稱"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <input
              name="customerId"
              placeholder="供應商 ID (選填，用於關聯客戶/供應商檔案)"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            />
          </div>
          <input
            name="amount"
            placeholder="應付金額"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm tabular-nums dark:border-zinc-600 dark:bg-zinc-950"
            required
          />
          <input
            name="billNo"
            placeholder="帳單號"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
          <input name="dueDate" type="date" className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950" />
          <input
            name="description"
            placeholder="說明"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 sm:col-span-2"
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
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">供應商</th>
              <th className="px-4 py-3 text-right">應付</th>
              <th className="px-4 py-3 text-right">已付</th>
              <th className="px-4 py-3 text-right">未付</th>
              <th className="px-4 py-3">狀態</th>
              <th className="px-4 py-3">到期</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const outstanding = Number(r.amount) - Number(r.paidAmount);
              return (
                <tr key={r.id} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="px-4 py-2">
                    <div className="font-medium">{r.vendorName}</div>
                    <div className="text-xs text-zinc-500">{r.billNo ?? ""}</div>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{r.amount.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{r.paidAmount.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{outstanding.toFixed(2)}</td>
                  <td className="px-4 py-2">{statusLabel[r.status] ?? r.status}</td>
                  <td className="px-4 py-2">{r.dueDate ? r.dueDate.toLocaleDateString("zh-CN") : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
