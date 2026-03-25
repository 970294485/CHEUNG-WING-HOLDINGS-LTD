import { prisma } from "@/lib/prisma";
import { getDefaultCompanyId } from "@/lib/company";
import { createAccountingCategory } from "@/lib/server/actions";

export default async function CategoriesPage() {
  const companyId = await getDefaultCompanyId();
  const list = await prisma.accountingCategory.findMany({
    where: { companyId },
    orderBy: { code: "asc" },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">會計類別</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            用於分錄行分類與後續分析維度。與 <a href="/data-entry/accounting/categories" className="text-blue-500 hover:underline">會計類別輸入</a> 模組數據互通。
          </p>
        </div>
        <a href="/data-entry/accounting/categories" className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-zinc-900/90 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90">
          前往進階資料輸入
        </a>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold">新增類別</h3>
        <form action={createAccountingCategory} className="mt-4 grid gap-3 sm:grid-cols-3">
          <input
            name="code"
            placeholder="代碼"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            required
          />
          <input
            name="name"
            placeholder="名稱"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            required
          />
          <input
            name="description"
            placeholder="說明（可選）"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
          <div className="sm:col-span-3">
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              儲存
            </button>
          </div>
        </form>
      </section>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">代碼</th>
              <th className="px-4 py-3">名稱</th>
              <th className="px-4 py-3">說明</th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id} className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="px-4 py-3 font-mono">{c.code}</td>
                <td className="px-4 py-3">{c.name}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{c.description ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
