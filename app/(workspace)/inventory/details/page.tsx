import Link from "next/link";
import { getDefaultCompanyId } from "@/lib/company";
import { prisma } from "@/lib/prisma";
import {
  formatWarehouseLabel,
  getProductInboundWeightedUnitCost,
} from "@/lib/server/inventory-reporting";

export const dynamic = "force-dynamic";

export default async function InventoryDetailsPage() {
  const companyId = await getDefaultCompanyId();

  const [balances, costByProduct] = await Promise.all([
    prisma.inventoryBalance.findMany({
      where: { companyId },
      include: { product: { select: { sku: true, name: true } } },
      orderBy: { product: { sku: "asc" } },
    }),
    getProductInboundWeightedUnitCost(companyId),
  ]);

  let totalInventoryValue = 0;
  const rows = balances.map((b) => {
    const cost = costByProduct.get(b.productId);
    const unit = cost?.unitCost;
    const qty = b.quantity;
    const lineValue = unit != null && Number.isFinite(unit) ? qty * unit : null;
    if (lineValue != null) totalInventoryValue += lineValue;
    return {
      id: b.id,
      productId: b.productId,
      sku: b.product.sku,
      name: b.product.name,
      warehouseLabel: formatWarehouseLabel(b.warehouseId),
      quantity: qty,
      unitCost: unit,
      lineValue,
    };
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">詳細庫存與成本</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            結存來自庫存臺賬；單位成本為歷史<strong>入庫</strong>流水中有單價的加權平均（僅供管理參考，非會計準則意義上的存貨計價結論）。
          </p>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm">
          <Link
            href="/inventory/transactions"
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            出入庫存管理
          </Link>
          <Link
            href="/sales/inventory-procurement"
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            庫存及採購對接
          </Link>
          <Link
            href="/data-entry/purchase-orders"
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            採購單管理
          </Link>
        </nav>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900/50">
        <span className="text-zinc-600 dark:text-zinc-400">庫存總額（可估值行加總）：</span>
        <span className="ml-2 font-semibold tabular-nums text-zinc-900 dark:text-white">
          {rows.some((r) => r.lineValue != null)
            ? totalInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : "—"}
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">產品</th>
              <th className="px-4 py-3">倉位</th>
              <th className="px-4 py-3 text-right">現存數量</th>
              <th className="px-4 py-3 text-right">加權平均單位成本</th>
              <th className="px-4 py-3 text-right">庫存金額（參考）</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="px-4 py-3 font-mono text-xs">{r.sku}</td>
                <td className="max-w-[14rem] truncate px-4 py-3" title={r.name}>
                  {r.name}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{r.warehouseLabel}</td>
                <td className="px-4 py-3 text-right font-medium tabular-nums">{r.quantity}</td>
                <td className="px-4 py-3 text-right tabular-nums text-zinc-600 dark:text-zinc-400">
                  {r.unitCost != null ? r.unitCost.toFixed(2) : "—"}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-zinc-600 dark:text-zinc-400">
                  {r.lineValue != null ? r.lineValue.toFixed(2) : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/inventory/transactions?productId=${encodeURIComponent(r.productId)}`}
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    流水
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-zinc-500">
                  暫無庫存臺賬。請先在「庫存及採購對接」入庫或採購收貨。
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
