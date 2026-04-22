"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CustomerDeleteButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (
      !window.confirm(
        `確定刪除客戶「${name}」？\n\n將一併刪除其銷售單據（報價／合同／預收發票）及跟進記錄；預收／應收關聯會解除。此操作無法還原。`
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
        return;
      }
      const body = await res.json().catch(() => ({}));
      alert(typeof body?.error === "string" ? body.error : "刪除失敗");
    } catch {
      alert("刪除失敗");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void onDelete()}
      disabled={busy}
      className="text-red-600 hover:text-red-800 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
    >
      {busy ? "刪除中…" : "刪除"}
    </button>
  );
}
