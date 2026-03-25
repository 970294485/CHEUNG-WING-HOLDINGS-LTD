import { prisma } from "@/lib/prisma";
import { getDefaultCompanyId } from "@/lib/company";
import { createGlAccount, toggleGlAccountForm } from "@/lib/server/actions";

const typeLabel: Record<string, string> = {
  ASSET: "資產",
  LIABILITY: "負債",
  EQUITY: "權益",
  REVENUE: "收入",
  EXPENSE: "費用",
};

export default async function GlAccountsPage() {
  const companyId = await getDefaultCompanyId();
  const accounts = await prisma.glAccount.findMany({
    where: { companyId },
    orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">會計科目</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">總帳科目維護，用於憑證分錄與報表彙總。</p>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold">新增科目</h3>
        <form action={createGlAccount} className="mt-4 grid gap-3 sm:grid-cols-4">
          <input
            name="code"
            placeholder="代碼"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            required
          />
          <input
            name="name"
            placeholder="名稱"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 sm:col-span-2"
            required
          />
          <select
            name="type"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          >
            <option value="ASSET">資產</option>
            <option value="LIABILITY">負債</option>
            <option value="EQUITY">權益</option>
            <option value="REVENUE">收入</option>
            <option value="EXPENSE">費用</option>
          </select>
          <div className="sm:col-span-4">
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
              <th className="px-4 py-3">類型</th>
              <th className="px-4 py-3">狀態</th>
              <th className="px-4 py-3 w-40">操作</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id} className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="px-4 py-3 font-mono tabular-nums">{a.code}</td>
                <td className="px-4 py-3">{a.name}</td>
                <td className="px-4 py-3">{typeLabel[a.type] ?? a.type}</td>
                <td className="px-4 py-3">{a.isActive ? "啟用" : "停用"}</td>
                <td className="px-4 py-3">
                  <form action={toggleGlAccountForm}>
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="isActive" value={a.isActive ? "false" : "true"} />
                    <button type="submit" className="text-xs text-blue-600 hover:underline dark:text-blue-400">
                      {a.isActive ? "停用" : "啟用"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
