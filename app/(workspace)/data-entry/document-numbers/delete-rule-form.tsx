"use client";

import { deleteDocumentNumberRule } from "@/lib/server/actions";

export function DeleteRuleForm({ ruleId }: { ruleId: string }) {
  return (
    <form
      action={deleteDocumentNumberRule}
      onSubmit={(e) => {
        if (!confirm("確定刪除此單號規則？")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="ruleId" value={ruleId} />
      <button
        type="submit"
        className="rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:bg-zinc-950 dark:text-red-400 dark:hover:bg-red-950/30"
      >
        刪除
      </button>
    </form>
  );
}
