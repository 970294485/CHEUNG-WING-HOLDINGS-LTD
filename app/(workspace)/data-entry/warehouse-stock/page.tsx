import { prisma } from "@/lib/prisma";
import { getDefaultCompanyId } from "@/lib/company";
import { createInitialInventory } from "@/lib/server/actions";

export default async function WarehouseStockPage() {
  const companyId = await getDefaultCompanyId();
  
  // 獲取所有產品供選擇
  const products = await prisma.product.findMany({
    where: { companyId },
    orderBy: { sku: "asc" },
  });

  // 獲取期初錄入的交易記錄
  const initialTransactions = await prisma.inventoryTransaction.findMany({
    where: { 
      companyId,
      referenceType: "INITIAL"
    },
    include: {
      product: true
    },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">期初倉存數據錄入</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          系統初始化時，手動錄入現有產品的庫存數量與單位成本。
        </p>
      </div>

      {products.length === 0 ? (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-900/50 dark:bg-yellow-900/20 dark:text-yellow-200">
          請先在「產品管理」中建立產品檔案，然後才能錄入期初庫存。
        </div>
      ) : (
        <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold">單筆錄入</h3>
          <form action={createInitialInventory} className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
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
              <label className="text-xs text-zinc-500">期初數量</label>
              <input
                name="quantity"
                type="number"
                min="1"
                placeholder="例如: 100"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-500">單位成本 (可選)</label>
              <input
                name="unitCost"
                type="number"
                step="0.01"
                min="0"
                placeholder="例如: 50.00"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              />
            </div>
            <div className="flex items-end sm:col-span-4 justify-end">
              <button
                type="submit"
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                確認入庫
              </button>
            </div>
          </form>
        </section>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-medium tracking-tight">最近錄入記錄</h3>
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">錄入時間</th>
                <th className="px-4 py-3">產品 SKU</th>
                <th className="px-4 py-3">產品名稱</th>
                <th className="px-4 py-3 text-right">入庫數量</th>
                <th className="px-4 py-3 text-right">單位成本</th>
              </tr>
            </thead>
            <tbody>
              {initialTransactions.map((t) => (
                <tr key={t.id} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="px-4 py-3 text-zinc-500">
                    {new Date(t.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono">{t.product.sku}</td>
                  <td className="px-4 py-3">{t.product.name}</td>
                  <td className="px-4 py-3 text-right font-medium text-green-600 dark:text-green-400">
                    +{t.quantity}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {t.unitCost ? Number(t.unitCost).toFixed(2) : "—"}
                  </td>
                </tr>
              ))}
              {initialTransactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                    暫無期初錄入記錄
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}