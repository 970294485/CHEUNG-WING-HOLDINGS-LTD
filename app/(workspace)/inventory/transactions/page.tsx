import Link from "next/link";
import { getDefaultCompanyId } from "@/lib/company";
import { prisma } from "@/lib/prisma";
import { formatInventoryReferenceType } from "@/lib/server/inventory-reporting";

export const dynamic = "force-dynamic";

const TAKE = 200;

type PageProps = {
  searchParams: Promise<{ productId?: string; type?: string }>;
};

export default async function InventoryTransactionsPage({ searchParams }: PageProps) {
  const companyId = await getDefaultCompanyId();
  const sp = await searchParams;
  const productId = typeof sp.productId === "string" && sp.productId.trim() ? sp.productId.trim() : undefined;
  const typeFilter =
    sp.type === "IN" || sp.type === "OUT" ? (sp.type as "IN" | "OUT") : undefined;

  const products = await prisma.product.findMany({
    where: { companyId },
    orderBy: { sku: "asc" },
    select: { id: true, sku: true, name: true },
  });

  const transactions = await prisma.inventoryTransaction.findMany({
    where: {
      companyId,
      ...(productId ? { productId } : {}),
      ...(typeFilter ? { type: typeFilter } : {}),
    },
    include: { product: { select: { sku: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: TAKE,
  });

  const query = new URLSearchParams();
  if (productId) query.set("productId", productId);
  if (typeFilter) query.set("type", typeFilter);
  const queryStr = query.toString();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">出入庫存管理</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            全公司庫存流水（與「庫存及採購對接」同一數據源）。預設顯示最近 {TAKE} 條。
          </p>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm">
          <Link
            href="/sales/inventory-procurement"
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            庫存及採購對接
          </Link>
          <Link
            href="/inventory/details"
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            詳細庫存與成本
          </Link>
          <Link
            href="/data-entry/purchase-orders"
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            採購單管理
          </Link>
        </nav>
      </div>

      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="min-w-[12rem] flex-1 space-y-1">
          <label htmlFor="flt-product" className="text-xs font-medium text-zinc-500">
            產品
          </label>
          <select
            id="flt-product"
            name="productId"
            defaultValue={productId ?? ""}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
          >
            <option value="">全部產品</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                [{p.sku}] {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="w-36 space-y-1">
          <label htmlFor="flt-type" className="text-xs font-medium text-zinc-500">
            類型
          </label>
          <select
            id="flt-type"
            name="type"
            defaultValue={typeFilter ?? ""}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
          >
            <option value="">全部</option>
            <option value="IN">入庫 (IN)</option>
            <option value="OUT">出庫 (OUT)</option>
          </select>
        </div>
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          篩選
        </button>
        {queryStr ? (
          <Link
            href="/inventory/transactions"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm text-zinc-700 dark:border-zinc-600 dark:text-zinc-300"
          >
            清除
          </Link>
        ) : null}
      </form>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">時間</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">產品</th>
              <th className="px-4 py-3 text-center">入出庫</th>
              <th className="px-4 py-3 text-right">數量</th>
              <th className="px-4 py-3 text-right">單位成本</th>
              <th className="px-4 py-3">來源類型</th>
              <th className="px-4 py-3 font-mono text-xs">關聯 ID</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-500">
                  {new Date(t.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{t.product.sku}</td>
                <td className="max-w-[12rem] truncate px-4 py-3" title={t.product.name}>
                  {t.product.name}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      t.type === "IN"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {t.type}
                  </span>
                </td>
                <td
                  className={`px-4 py-3 text-right font-medium tabular-nums ${
                    t.type === "IN" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {t.type === "IN" ? "+" : "-"}
                  {t.quantity}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-zinc-600 dark:text-zinc-400">
                  {t.unitCost != null ? Number(t.unitCost).toFixed(2) : "—"}
                </td>
                <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                  {formatInventoryReferenceType(t.referenceType)}
                </td>
                <td className="max-w-[8rem] truncate px-4 py-3 font-mono text-xs text-zinc-500" title={t.referenceId ?? ""}>
                  {t.referenceId ?? "—"}
                </td>
              </tr>
            ))}
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-zinc-500">
                  暫無符合條件的流水。可至「庫存及採購對接」新增入出庫或採購收貨。
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
