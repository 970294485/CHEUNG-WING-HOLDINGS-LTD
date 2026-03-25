import { prisma } from "@/lib/prisma";
import { getDefaultCompanyId } from "@/lib/company";
import { createInventoryTransaction } from "@/lib/server/actions";

export default async function InventoryPage() {
  const companyId = await getDefaultCompanyId();
  
  const products = await prisma.product.findMany({
    where: { companyId },
    orderBy: { sku: "asc" },
  });

  const balances = await prisma.inventoryBalance.findMany({
    where: { companyId },
    include: { product: true },
    orderBy: { product: { sku: "asc" } },
  });

  const transactions = await prisma.inventoryTransaction.findMany({
    where: { companyId },
    include: { product: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">庫存與採購對接</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          管理庫存出入庫操作，查看實時庫存台賬及交易記錄。
        </p>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold">新增出入庫記錄</h3>
        <form action={createInventoryTransaction} className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-5">
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs text-zinc-500">選擇產品</label>
            <select
              name="productId"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              required
            >
              <option value="">-- 請選擇產品 --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.sku}] {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-500">操作類型</label>
            <select
              name="type"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              required
            >
              <option value="IN">入庫 (IN)</option>
              <option value="OUT">出庫 (OUT)</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-500">數量</label>
            <input
              name="quantity"
              type="number"
              min="1"
              placeholder="例如: 10"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-500">單位成本/價格</label>
            <input
              name="unitCost"
              type="number"
              step="0.01"
              min="0"
              placeholder="例如: 50.00"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            />
          </div>
          <div className="flex items-end sm:col-span-5 justify-end">
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              確認提交
            </button>
          </div>
        </form>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-lg font-medium tracking-tight">實時庫存台賬</h3>
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3">產品 SKU</th>
                  <th className="px-4 py-3">產品名稱</th>
                  <th className="px-4 py-3 text-right">當前庫存</th>
                </tr>
              </thead>
              <tbody>
                {balances.map((b) => (
                  <tr key={b.id} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="px-4 py-3 font-mono">{b.product.sku}</td>
                    <td className="px-4 py-3">{b.product.name}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      {b.quantity}
                    </td>
                  </tr>
                ))}
                {balances.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-zinc-500">
                      暫無庫存記錄
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium tracking-tight">最近交易流水</h3>
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3">時間</th>
                  <th className="px-4 py-3">產品</th>
                  <th className="px-4 py-3 text-center">類型</th>
                  <th className="px-4 py-3 text-right">數量</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="px-4 py-3 text-zinc-500 text-xs">
                      {new Date(t.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{t.product.sku}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${t.type === "IN" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                        {t.type}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-right font-medium tabular-nums ${t.type === "IN" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {t.type === "IN" ? "+" : "-"}{t.quantity}
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                      暫無交易記錄
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
