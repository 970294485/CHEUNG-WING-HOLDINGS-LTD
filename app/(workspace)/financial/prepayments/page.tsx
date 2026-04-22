import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getDefaultCompanyId } from "@/lib/company";
import { createPrepayment } from "@/lib/server/actions";
import { PrintButton } from "@/components/print-button";
import { TreasuryReceivableHubNav } from "@/components/finance/TreasuryReceivableHubNav";

const statusLabel: Record<string, string> = {
  OPEN: "未核銷",
  PARTIALLY_APPLIED: "部分核銷",
  CLOSED: "已關閉",
};

function contractLinkLabel(linked: string | null | undefined): string {
  const v = linked?.trim();
  return v && v.length > 0 ? v : "—";
}

function contractMatchBadge(
  status: string,
  linkedDocumentId: string | null | undefined
): { text: string; className: string } {
  const lid = linkedDocumentId?.trim();
  if (status === "OPEN" && !lid) {
    return {
      text: "未對接合同",
      className:
        "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
    };
  }
  if (status === "OPEN" && lid) {
    return {
      text: "已關聯合同",
      className: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
    };
  }
  return {
    text: "—",
    className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  };
}

export default async function PrepaymentsPage({
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

  const rows = await prisma.prepayment.findMany({
    where: {
      companyId,
      ...(filterCustomerId ? { customerId: filterCustomerId } : {}),
    },
    orderBy: { receivedAt: "desc" },
    take: 100,
    include: {
      customer: { select: { id: true, name: true, code: true } },
    },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <TreasuryReceivableHubNav active="prepay" customerId={filterCustomerId} />

      <div>
        <h2 className="text-2xl font-semibold tracking-tight">預收款項管理</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          記錄預收並與銷售合同關聯；請盡量填寫「客戶檔案 ID」以便與預收款對接、應收帳款使用同一主檔串聯。
        </p>
        {filterCustomerId && filterCustomerName ? (
          <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
            目前篩選客戶：<span className="font-medium">{filterCustomerName}</span>
          </p>
        ) : null}
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold">預收款表單 (Pre-payment Form)</h3>
        <form action={createPrepayment} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <input
              name="payerName"
              placeholder="顯示用付款人 / 客戶名稱（選填，建議與客戶檔案一致）"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              defaultValue={filterCustomerName ?? undefined}
            />
          </div>
          <div className="flex flex-col gap-1">
            <input
              name="customerId"
              placeholder="客戶檔案 ID（選填，強烈建議填寫）"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              defaultValue={filterCustomerId ?? undefined}
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
            defaultValue={new Date().toISOString().split("T")[0]}
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
            placeholder="預計對應合同編號（選填；正式對接請在「預收款對接」完成）"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 sm:col-span-2"
          />
          <input type="hidden" name="linkedDocumentType" value="CONTRACT" />

          <div className="mt-2 flex gap-3 sm:col-span-2">
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
              <th className="px-4 py-3">客戶</th>
              <th className="px-4 py-3">收款賬戶</th>
              <th className="px-4 py-3">預計 / 已關聯合同</th>
              <th className="px-4 py-3">合同歸屬</th>
              <th className="px-4 py-3 text-right">預收金額</th>
              <th className="px-4 py-3">核銷狀態</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const displayName = r.customer?.name ?? r.payerName ?? "—";
              const badge = contractMatchBadge(r.status, r.linkedDocumentId);
              const matchHref = r.customerId
                ? `/financial/contract-invoice-prepay?customerId=${encodeURIComponent(r.customerId)}`
                : "/financial/contract-invoice-prepay";
              const arHref = r.customerId
                ? `/accounting/ar?customer=${encodeURIComponent(r.customerId)}`
                : "/accounting/ar";

              return (
                <tr key={r.id} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                    {r.receivedAt.toLocaleDateString("zh-CN")}
                  </td>
                  <td className="px-4 py-2">
                    <div className="font-medium">
                      {r.customerId ? (
                        <Link
                          href={`/financial/prepayments?customer=${encodeURIComponent(r.customerId)}`}
                          className="text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {displayName}
                        </Link>
                      ) : (
                        displayName
                      )}
                    </div>
                    {r.customer?.code ? (
                      <div className="text-xs text-zinc-500">{r.customer.code}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">{r.reference ?? "—"}</td>
                  <td className="px-4 py-2 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                    {contractLinkLabel(r.linkedDocumentId)}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${badge.className}`}
                    >
                      {badge.text}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right text-sm font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                    + ${r.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        r.status === "OPEN"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : r.status === "PARTIALLY_APPLIED"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}
                    >
                      {statusLabel[r.status] ?? r.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-col gap-1 text-xs">
                      {r.status === "OPEN" && !r.linkedDocumentId?.trim() ? (
                        <Link href={matchHref} className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                          去對接
                        </Link>
                      ) : null}
                      {r.customerId ? (
                        <Link href={arHref} className="text-zinc-600 hover:underline dark:text-zinc-400">
                          應收帳款
                        </Link>
                      ) : null}
                      {!r.customerId && !(r.status === "OPEN" && !r.linkedDocumentId?.trim()) ? (
                        <span className="text-zinc-400">—</span>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-zinc-500">
                  {filterCustomerId
                    ? "此客戶下暫無預收款，或請清除篩選查看全部。"
                    : "暫無預收款數據"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
