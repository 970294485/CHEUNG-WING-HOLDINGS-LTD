import { issueSalesDocumentLine } from "@/lib/server/actions";

const DOC_TYPE_SHORT: Record<string, string> = {
  QUOTATION: "報價",
  CONTRACT: "合同",
  PROFORMA_INVOICE: "預收",
};

export type SalesShipLine = {
  salesDocumentItemId: string;
  documentNo: string;
  docType: string;
  customerName: string;
  productSku: string;
  productName: string;
  ordered: number;
  shipped: number;
  remaining: number;
  defaultUnitCost: string;
};

export function SalesOrderShipSection({ lines }: { lines: SalesShipLine[] }) {
  if (lines.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        目前沒有待出庫的銷售明細（單據已取消、已全數出庫，或尚無銷售單據）。請至「客戶／銷售單據」建立報價／合同／預收發票。
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
          <tr>
            <th className="px-3 py-2">單據</th>
            <th className="px-3 py-2">客戶</th>
            <th className="px-3 py-2">產品</th>
            <th className="px-3 py-2 text-right">訂單數</th>
            <th className="px-3 py-2 text-right">已出</th>
            <th className="px-3 py-2 text-right">待出</th>
            <th className="px-3 py-2 min-w-[14rem]">關聯出庫</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.salesDocumentItemId} className="border-b border-zinc-100 dark:border-zinc-800">
              <td className="px-3 py-2">
                <span className="text-xs text-zinc-500">{DOC_TYPE_SHORT[line.docType] ?? line.docType}</span>
                <span className="ml-1 font-mono text-xs">{line.documentNo}</span>
              </td>
              <td className="px-3 py-2">{line.customerName}</td>
              <td className="px-3 py-2">
                <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">{line.productSku}</span>
                <span className="ml-1">{line.productName}</span>
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{line.ordered}</td>
              <td className="px-3 py-2 text-right tabular-nums text-zinc-600 dark:text-zinc-400">{line.shipped}</td>
              <td className="px-3 py-2 text-right font-medium tabular-nums">{line.remaining}</td>
              <td className="px-3 py-2">
                <form action={issueSalesDocumentLine} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="salesDocumentItemId" value={line.salesDocumentItemId} />
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
                    className="rounded-md bg-rose-700 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-rose-800 dark:bg-rose-800 dark:hover:bg-rose-700"
                  >
                    確認出庫
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
