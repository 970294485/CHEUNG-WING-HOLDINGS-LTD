import { receivePurchaseOrderLine } from "@/lib/server/actions";

export type PoReceiveLine = {
  purchaseOrderItemId: string;
  poNumber: string;
  vendorName: string;
  productSku: string;
  productName: string;
  ordered: number;
  received: number;
  remaining: number;
  defaultUnitCost: string;
};

export function PurchaseOrderReceiveSection({ lines }: { lines: PoReceiveLine[] }) {
  if (lines.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        目前沒有待收貨的採購明細（採購單已取消、已全數收貨，或尚無採購單）。
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
          <tr>
            <th className="px-3 py-2">採購單號</th>
            <th className="px-3 py-2">供應商</th>
            <th className="px-3 py-2">產品</th>
            <th className="px-3 py-2 text-right">訂購</th>
            <th className="px-3 py-2 text-right">已收</th>
            <th className="px-3 py-2 text-right">待收</th>
            <th className="px-3 py-2 min-w-[14rem]">收貨入庫</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.purchaseOrderItemId} className="border-b border-zinc-100 dark:border-zinc-800">
              <td className="px-3 py-2 font-mono text-xs">{line.poNumber}</td>
              <td className="px-3 py-2">{line.vendorName}</td>
              <td className="px-3 py-2">
                <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">{line.productSku}</span>
                <span className="ml-1">{line.productName}</span>
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{line.ordered}</td>
              <td className="px-3 py-2 text-right tabular-nums text-zinc-600 dark:text-zinc-400">
                {line.received}
              </td>
              <td className="px-3 py-2 text-right font-medium tabular-nums">{line.remaining}</td>
              <td className="px-3 py-2">
                <form action={receivePurchaseOrderLine} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="purchaseOrderItemId" value={line.purchaseOrderItemId} />
                  <div className="space-y-0.5">
                    <label className="text-[10px] text-zinc-500">本次數量</label>
                    <input
                      name="quantity"
                      type="number"
                      min={1}
                      max={line.remaining}
                      defaultValue={line.remaining}
                      required
                      className="w-20 rounded-md border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-950"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[10px] text-zinc-500">單位成本</label>
                    <input
                      name="unitCost"
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={line.defaultUnitCost}
                      className="w-24 rounded-md border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-950"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-md bg-emerald-700 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-800 dark:bg-emerald-800 dark:hover:bg-emerald-700"
                  >
                    確認收貨
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
