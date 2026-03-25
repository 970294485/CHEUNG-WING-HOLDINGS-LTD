"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
      onClick={() => window.print()}
    >
      列印收據
    </button>
  );
}
