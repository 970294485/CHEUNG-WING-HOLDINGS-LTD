import Link from "next/link";
import { Receipt, TrendingDown, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getDefaultCompanyId } from "@/lib/company";
import { createReceivable } from "@/lib/server/actions";
import { TreasuryReceivableHubNav } from "@/components/finance/TreasuryReceivableHubNav";
import { loadUnifiedAccountsReceivable } from "@/lib/finance/unified-accounts-receivable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const statusLabel: Record<string, string> = {
  OPEN: "未收",
  PARTIAL: "部分收款",
  CLOSED: "已結清",
};

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-zinc-400 focus-visible:border-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/40 dark:border-zinc-600 dark:bg-zinc-950 dark:placeholder:text-zinc-500 dark:focus-visible:border-zinc-500 dark:focus-visible:ring-zinc-600/40";

function statusBadgeClass(status: string) {
  switch (status) {
    case "OPEN":
      return "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200";
    case "PARTIAL":
      return "bg-sky-100 text-sky-900 dark:bg-sky-950/50 dark:text-sky-200";
    case "CLOSED":
      return "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200";
    default:
      return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
  }
}

function fmtMoney(n: number) {
  return n.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function AccountsReceivablePage({
  searchParams,
}: {
  searchParams: Promise<{ customer?: string }>;
}) {
  const companyId = await getDefaultCompanyId();
  const sp = await searchParams;
  const rawCustomer = sp.customer?.trim() || null;

  let filterCustomerId: string | null = null;
  let filterCustomerName: string | null = null;
  if (rawCustomer) {
    const cust = await prisma.customer.findFirst({
      where: { id: rawCustomer, companyId },
      select: { id: true, name: true },
    });
    if (cust) {
      filterCustomerId = cust.id;
      filterCustomerName = cust.name;
    }
  }

  const rows = await loadUnifiedAccountsReceivable(companyId, {
    filterCustomerId,
  });

  const totalAmount = rows.reduce((s, r) => s + r.amount, 0);
  const totalOutstanding = rows.reduce((s, r) => s + (r.amount - r.receivedAmount), 0);
  const openRows = rows.filter((r) => r.status === "OPEN" || r.status === "PARTIAL");

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10">
      <TreasuryReceivableHubNav active="ar" customerId={filterCustomerId} />

      <header className="border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              應收帳款管理
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              與<strong className="font-medium text-zinc-800 dark:text-zinc-200">銷售合同</strong>
              同步：「已收」為已對接至該合同的預收款加總。「手動」列為表單補登之應收。
            </p>
          </div>
          {filterCustomerId && filterCustomerName ? (
            <div className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
              <span className="text-amber-800/80 dark:text-amber-200/80">篩選客戶 · </span>
              <span className="font-medium">{filterCustomerName}</span>
            </div>
          ) : null}
        </div>

        {rows.length > 0 ? (
          <dl className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-zinc-200/80 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
              <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                <Receipt className="h-3.5 w-3.5" />
                應收合計
              </dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                ¥{fmtMoney(totalAmount)}
              </dd>
            </div>
            <div className="rounded-lg border border-zinc-200/80 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
              <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                <TrendingDown className="h-3.5 w-3.5" />
                未收合計
              </dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums text-orange-700 dark:text-orange-400">
                ¥{fmtMoney(totalOutstanding)}
              </dd>
            </div>
            <div className="rounded-lg border border-zinc-200/80 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
              <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                <Users className="h-3.5 w-3.5" />
                待跟進筆數
              </dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                {openRows.length}
                <span className="ml-1 text-sm font-normal text-zinc-500">筆（未收 / 部分）</span>
              </dd>
            </div>
          </dl>
        ) : null}
      </header>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">手動登記應收（補充）</CardTitle>
          <CardDescription>
            用於合同以外的應收（如單獨發票尾款）。填寫客戶檔案 ID 可與預收款、合同同一主檔串聯。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createReceivable} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ar-customer-name">客戶名稱</Label>
              <input
                id="ar-customer-name"
                name="customerName"
                placeholder="例如：某某有限公司"
                className={inputClass}
                required
                defaultValue={filterCustomerName ?? undefined}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ar-customer-id">客戶檔案 ID（選填）</Label>
              <input
                id="ar-customer-id"
                name="customerId"
                placeholder="與客戶主檔一致之 ID"
                className={inputClass}
                defaultValue={filterCustomerId ?? undefined}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ar-amount">應收金額</Label>
              <input
                id="ar-amount"
                name="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                className={cn(inputClass, "tabular-nums")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ar-invoice">發票 / 單據號（選填）</Label>
              <input
                id="ar-invoice"
                name="invoiceNo"
                placeholder="發票或內部單據編號"
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ar-due">到期日（選填）</Label>
              <input id="ar-due" name="dueDate" type="date" className={inputClass} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ar-desc">說明（選填）</Label>
              <input
                id="ar-desc"
                name="description"
                placeholder="摘要說明"
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" className="min-w-[120px]">
                儲存
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50/80 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900/50">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">應收臺帳</h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              共 {rows.length} 筆（含銷售合同與手動）
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[960px] w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/90 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400">
                <th className="whitespace-nowrap px-4 py-3">來源</th>
                <th className="whitespace-nowrap px-4 py-3">客戶</th>
                <th className="min-w-[140px] px-4 py-3">單號 / 摘要</th>
                <th className="whitespace-nowrap px-4 py-3">立帳日</th>
                <th className="whitespace-nowrap px-4 py-3 text-right">應收</th>
                <th className="whitespace-nowrap px-4 py-3 text-right">已收</th>
                <th className="whitespace-nowrap px-4 py-3 text-right">未收</th>
                <th className="whitespace-nowrap px-4 py-3">狀態</th>
                <th className="whitespace-nowrap px-4 py-3">到期</th>
                <th className="whitespace-nowrap px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-16 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                      <div className="rounded-full bg-zinc-100 p-3 dark:bg-zinc-800">
                        <Receipt className="h-6 w-6 text-zinc-400" />
                      </div>
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">暫無應收資料</p>
                      <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                        {filterCustomerId
                          ? "此客戶下尚無合同或手動應收，您可清除篩選查看全部公司資料。"
                          : "建立銷售合同並在「預收款對接」關聯預收後，合同列會自動出現；亦可在上方手動登記。"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const outstanding = r.amount - r.receivedAmount;
                  const prepayHref = r.customerId
                    ? `/financial/prepayments?customer=${encodeURIComponent(r.customerId)}`
                    : "/financial/prepayments";
                  const matchHref = r.customerId
                    ? `/financial/contract-invoice-prepay?customerId=${encodeURIComponent(r.customerId)}`
                    : "/financial/contract-invoice-prepay";

                  return (
                    <tr
                      key={r.id}
                      className="transition-colors hover:bg-zinc-50/90 dark:hover:bg-zinc-900/40"
                    >
                      <td className="px-4 py-3 align-top">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                            r.source === "CONTRACT"
                              ? "bg-sky-100 text-sky-900 dark:bg-sky-950/50 dark:text-sky-200"
                              : "bg-zinc-200/90 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200"
                          )}
                        >
                          {r.source === "CONTRACT" ? "銷售合同" : "手動"}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="max-w-[10rem] font-medium leading-snug text-zinc-900 dark:text-zinc-100">
                          {r.customerId ? (
                            <Link
                              href={`/accounting/ar?customer=${encodeURIComponent(r.customerId)}`}
                              className="text-blue-600 hover:underline dark:text-blue-400"
                            >
                              {r.customerName}
                            </Link>
                          ) : (
                            r.customerName
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="font-mono text-xs font-medium text-zinc-800 dark:text-zinc-200">
                          {r.invoiceNo ?? "—"}
                        </div>
                        {r.description ? (
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                            {r.description}
                          </p>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 align-top text-zinc-600 tabular-nums dark:text-zinc-400">
                        {r.issueDate.toLocaleDateString("zh-CN")}
                      </td>
                      <td className="px-4 py-3 align-top text-right tabular-nums text-zinc-800 dark:text-zinc-200">
                        ¥{fmtMoney(r.amount)}
                      </td>
                      <td className="px-4 py-3 align-top text-right tabular-nums text-emerald-700 dark:text-emerald-400/90">
                        ¥{fmtMoney(r.receivedAmount)}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-3 align-top text-right text-sm font-medium tabular-nums",
                          outstanding > 0.005
                            ? "text-orange-700 dark:text-orange-400"
                            : "text-zinc-500 dark:text-zinc-400"
                        )}
                      >
                        ¥{fmtMoney(outstanding)}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                            statusBadgeClass(r.status)
                          )}
                        >
                          {statusLabel[r.status] ?? r.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 align-top text-zinc-600 dark:text-zinc-400">
                        {r.dueDate ? r.dueDate.toLocaleDateString("zh-CN") : "—"}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-col gap-1.5 text-xs">
                          {r.source === "CONTRACT" && r.salesDocumentId ? (
                            <Link
                              href={`/sales/contracts/${r.salesDocumentId}`}
                              className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                            >
                              查看合同
                            </Link>
                          ) : null}
                          <Link
                            href={prepayHref}
                            className="text-zinc-600 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-200"
                          >
                            預收款
                          </Link>
                          <Link
                            href={matchHref}
                            className="text-zinc-600 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-200"
                          >
                            預收對接
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
