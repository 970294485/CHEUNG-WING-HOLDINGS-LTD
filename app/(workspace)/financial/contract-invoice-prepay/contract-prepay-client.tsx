"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createContractDifferenceProformaInvoice,
  linkOpenPrepaymentToContract,
} from "@/lib/server/contract-prepay-actions";

export type ContractPrepayRow = {
  id: string;
  documentNo: string;
  customerId: string;
  customerName: string;
  totalAmount: number;
  prepaidAmount: number;
  invoicedAmount: number;
  remainingAmount: number;
  pendingInvoice: number;
  status: string;
};

export type OpenPrepayPayload = {
  id: string;
  amount: number;
  customerId: string | null;
  payerName: string | null;
  customerName: string | null;
};

type Props = {
  rows: ContractPrepayRow[];
  openPrepay: OpenPrepayPayload | null;
  openCustomerLabel: string | null;
  /** 僅顯示該客戶名下的銷售合同（URL ?customerId=） */
  filterCustomerId?: string | null;
  filterCustomerName?: string | null;
};

function norm(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

export function ContractPrepayClient({
  rows,
  openPrepay,
  openCustomerLabel,
  filterCustomerId,
  filterCustomerName,
}: Props) {
  const router = useRouter();
  const [selectedContractId, setSelectedContractId] = useState("");
  const [amountInput, setAmountInput] = useState(
    openPrepay ? openPrepay.amount.toFixed(2) : ""
  );
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const formAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (openPrepay) {
      setAmountInput(openPrepay.amount.toFixed(2));
    } else {
      setAmountInput("");
    }
  }, [openPrepay?.id, openPrepay?.amount]);

  const displayRows =
    filterCustomerId?.trim() != null && filterCustomerId.trim() !== ""
      ? rows.filter((r) => r.customerId === filterCustomerId.trim())
      : rows;

  const actionable = displayRows.filter((r) => r.status !== "已結清");

  function pickMatchingContractId(): string | null {
    if (!openPrepay) return null;
    for (const r of actionable) {
      if (openPrepay.customerId && r.customerId === openPrepay.customerId) return r.id;
    }
    const payer = norm(openPrepay.payerName);
    const cust = norm(openPrepay.customerName);
    const needle = openPrepay.customerId ? "" : payer || cust;
    if (!needle) return null;
    for (const r of actionable) {
      if (norm(r.customerName) === needle) return r.id;
    }
    return null;
  }

  function scrollToForm() {
    formAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function onImmediateHandle() {
    const id = pickMatchingContractId();
    if (id) {
      setSelectedContractId(id);
      setFeedback({ kind: "ok", text: "已為您選取客戶相符的合同，請確認後點「一鍵對接」。" });
    } else {
      setFeedback({
        kind: "err",
        text: "找不到與該預收款客戶相符且尚未結清的合同，請手動選擇合同。",
      });
    }
    scrollToForm();
  }

  function runLink() {
    setFeedback(null);
    if (!openPrepay) {
      setFeedback({ kind: "err", text: "目前沒有可對接的開放中預收款。" });
      return;
    }
    if (!selectedContractId) {
      setFeedback({ kind: "err", text: "請先選擇要對接的銷售合同。" });
      return;
    }
    const fd = new FormData();
    fd.set("prepaymentId", openPrepay.id);
    fd.set("contractId", selectedContractId);
    fd.set("amount", amountInput.trim());
    startTransition(async () => {
      const res = await linkOpenPrepaymentToContract(fd);
      if (res.ok) {
        setFeedback({ kind: "ok", text: res.message ?? "對接成功。" });
        router.refresh();
      } else {
        setFeedback({ kind: "err", text: res.message });
      }
    });
  }

  function runProforma() {
    setFeedback(null);
    if (!selectedContractId) {
      setFeedback({ kind: "err", text: "請先選擇合同。" });
      return;
    }
    const fd = new FormData();
    fd.set("contractId", selectedContractId);
    startTransition(async () => {
      const res = await createContractDifferenceProformaInvoice(fd);
      if (res.ok) {
        setFeedback({ kind: "ok", text: res.message ?? "已建立預收發票。" });
        router.refresh();
      } else {
        setFeedback({ kind: "err", text: res.message });
      }
    });
  }

  return (
    <>
      {filterCustomerId?.trim() ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          已按客戶篩選：
          <span className="font-medium">
            {filterCustomerName?.trim() || filterCustomerId}
          </span>
          ；合同列表與可選合同僅包含該客戶。預收款提示亦僅考慮該客戶名下待對接預收。
        </div>
      ) : null}

      {openPrepay && openCustomerLabel ? (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/30">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1 md:flex md:justify-between">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>自動關聯提示：</strong> 客戶 <strong>{openCustomerLabel}</strong> 尚有{" "}
                <span className="font-bold">${openPrepay.amount.toFixed(2)}</span>{" "}
                預收款未處理，是否立即對接並開立發票？
              </p>
              <p className="mt-2 text-sm md:mt-0 md:ml-6">
                <button
                  type="button"
                  onClick={onImmediateHandle}
                  disabled={pending}
                  className="whitespace-nowrap font-medium text-blue-700 hover:text-blue-600 disabled:opacity-50 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  立即處理 &rarr;
                </button>
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div ref={formAnchorRef} className="grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-4 text-sm font-semibold">對接處理表單</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="prepay-contract-select" className="mb-1 block text-xs font-medium text-zinc-500">
                選擇銷售合同
              </label>
              <select
                id="prepay-contract-select"
                value={selectedContractId}
                onChange={(e) => setSelectedContractId(e.target.value)}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              >
                <option value="">— 請選擇 —</option>
                {actionable.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.documentNo} · {r.customerName}（待開票 ${r.pendingInvoice.toFixed(2)}）
                  </option>
                ))}
                {actionable.length === 0 && filterCustomerId?.trim() ? (
                  <option value="" disabled>
                    此客戶暫無待衝抵合同
                  </option>
                ) : null}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">已開立預收發票合計</label>
              <div className="text-lg font-medium tabular-nums">
                {selectedContractId
                  ? (() => {
                      const r = rows.find((x) => x.id === selectedContractId);
                      return r ? `$${r.invoicedAmount.toFixed(2)}` : "—";
                    })()
                  : "—"}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">預收款可用餘額</label>
              <div className="text-lg font-medium text-emerald-600 tabular-nums dark:text-emerald-400">
                {openPrepay ? `$${openPrepay.amount.toFixed(2)}` : "—"}
              </div>
            </div>
            <div>
              <label htmlFor="prepay-amount" className="mb-1 block text-xs font-medium text-zinc-500">
                本次對接金額（須與預收款全額一致）
              </label>
              <input
                id="prepay-amount"
                type="number"
                step="0.01"
                min="0"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                disabled={!openPrepay}
                placeholder="0.00"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm tabular-nums disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-950"
              />
            </div>
            {feedback ? (
              <p
                className={`text-sm ${feedback.kind === "ok" ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
                role="status"
              >
                {feedback.text}
              </p>
            ) : null}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={runLink}
                disabled={pending || !openPrepay || actionable.length === 0}
                className="flex-1 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
              >
                {pending ? "處理中…" : "一鍵對接"}
              </button>
              <button
                type="button"
                onClick={runProforma}
                disabled={pending || actionable.length === 0}
                className="flex-1 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                {pending ? "處理中…" : "生成差額發票"}
              </button>
            </div>
          </div>
        </section>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h3 className="text-sm font-semibold">合同對接明細</h3>
        </div>
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">合同編號 / 客戶</th>
              <th className="px-4 py-3 text-right">合同總額</th>
              <th className="px-4 py-3 text-right">已收預付款</th>
              <th className="px-4 py-3 text-right">待開票金額</th>
              <th className="px-4 py-3 text-right">剩餘待收</th>
              <th className="px-4 py-3">狀態</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((c) => (
              <tr key={c.id} className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="px-4 py-2">
                  <div className="font-medium">{c.documentNo}</div>
                  <div className="text-xs text-zinc-500">{c.customerName}</div>
                </td>
                <td className="px-4 py-2 text-right tabular-nums">${c.totalAmount.toFixed(2)}</td>
                <td className="px-4 py-2 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                  ${c.prepaidAmount.toFixed(2)}
                </td>
                <td className="px-4 py-2 text-right tabular-nums">${c.pendingInvoice.toFixed(2)}</td>
                <td className="px-4 py-2 text-right tabular-nums font-medium text-red-600 dark:text-red-400">
                  ${c.remainingAmount.toFixed(2)}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      c.status === "已結清"
                        ? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    }`}
                  >
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-2">
                  {c.status !== "已結清" && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedContractId(c.id);
                        scrollToForm();
                        setFeedback({ kind: "ok", text: `已選取合同 ${c.documentNo}，可進行對接或生成差額發票。` });
                      }}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      處理對接
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {displayRows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-zinc-500">
                  {filterCustomerId?.trim()
                    ? "此客戶下暫無銷售合同，或請清除篩選查看全部。"
                    : "暫無合同數據；建立銷售合同後可在此對接預收款與發票。"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
