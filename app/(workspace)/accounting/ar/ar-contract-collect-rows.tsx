"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ContractPrepayContractRow } from "@/lib/finance/contract-prepay-data";
import { receiveContractRemainingAsPrepayment } from "@/lib/server/contract-prepay-actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  rows: ContractPrepayContractRow[];
};

export function ArContractCollectRows({ rows }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ContractPrepayContractRow | null>(null);
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [receivedAt, setReceivedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);

  function openFor(row: ContractPrepayContractRow) {
    setSelected(row);
    setAmount(row.remainingAmount >= 0.01 ? row.remainingAmount.toFixed(2) : "");
    setReference("");
    setNote("");
    setReceivedAt(new Date().toISOString().slice(0, 10));
    setError(null);
    setOpen(true);
  }

  function submit() {
    if (!selected) return;
    setError(null);
    const fd = new FormData();
    fd.set("contractId", selected.id);
    fd.set("amount", amount.trim());
    fd.set("reference", reference.trim());
    fd.set("note", note.trim());
    fd.set("receivedAt", receivedAt.trim());
    startTransition(async () => {
      const res = await receiveContractRemainingAsPrepayment(fd);
      if (res.ok) {
        setOpen(false);
        setSelected(null);
        router.refresh();
      } else {
        setError(res.message);
      }
    });
  }

  return (
    <>
      <tbody>
        {rows.map((c) => {
          const canCollect = c.status !== "已結清" && c.remainingAmount >= 0.01;
          return (
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
                {canCollect ? (
                  <button
                    type="button"
                    onClick={() => openFor(c)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    收取剩餘待收
                  </button>
                ) : (
                  <span className="text-xs text-zinc-400">—</span>
                )}
              </td>
            </tr>
          );
        })}
        {rows.length === 0 && (
          <tr>
            <td colSpan={7} className="px-4 py-8 text-center text-sm text-zinc-500">
              暫無銷售合同；建立合同後將於此顯示合同應收匯總。
            </td>
          </tr>
        )}
      </tbody>

      <Dialog open={open} onOpenChange={(v) => !pending && setOpen(v)}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => pending && e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>收取剩餘待收</DialogTitle>
            <DialogDescription>
              將建立一筆<strong>已對接至本合同</strong>的預收款，與「預收款管理」資料來源相同；可部分收款，金額不可超過目前剩餘待收。
            </DialogDescription>
          </DialogHeader>
          {selected ? (
            <div className="grid gap-3 py-2">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                合同 <span className="font-medium text-zinc-900 dark:text-zinc-100">{selected.documentNo}</span> ·
                剩餘待收{" "}
                <span className="font-medium tabular-nums">${selected.remainingAmount.toFixed(2)}</span>
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="ar-collect-amount">收款金額</Label>
                <Input
                  id="ar-collect-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={pending}
                  className="tabular-nums"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ar-collect-ref">參考號 / 流水號（選填）</Label>
                <Input
                  id="ar-collect-ref"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  disabled={pending}
                  placeholder="例如銀行流水末碼"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ar-collect-note">備註（選填）</Label>
                <Input
                  id="ar-collect-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={pending}
                  placeholder="留空則寫入預設說明"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ar-collect-date">到帳日期</Label>
                <Input
                  id="ar-collect-date"
                  type="date"
                  value={receivedAt}
                  onChange={(e) => setReceivedAt(e.target.value)}
                  disabled={pending}
                />
              </div>
              {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              取消
            </Button>
            <Button type="button" onClick={submit} disabled={pending || !selected}>
              {pending ? "處理中…" : "確認登記"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
