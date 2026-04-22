import Link from "next/link";

/** 無公司資料時在後台各頁顯示的提示（不拋錯，避免整頁崩潰）。 */
export function NoCompanyMessage() {
  return (
    <div className="mx-auto max-w-xl rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
      <h2 className="text-lg font-semibold">尚未建立公司資料</h2>
      <p className="mt-2 text-sm leading-relaxed">
        資料庫中還沒有任何公司記錄，報表、客戶與單據等模組暫不可用。請先建立第一家公司。
      </p>
      <div className="mt-4">
        <Link
          href="/data-entry/company-profile"
          className="inline-flex rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          前往「公司基本資料」
        </Link>
      </div>
      <p className="mt-4 text-xs text-amber-800/80 dark:text-amber-200/80">
        或在終端執行：{" "}
        <code className="rounded bg-white/60 px-1 dark:bg-black/30">npx prisma db push && npx prisma db seed</code>{" "}
        載入示範資料。
      </p>
    </div>
  );
}
