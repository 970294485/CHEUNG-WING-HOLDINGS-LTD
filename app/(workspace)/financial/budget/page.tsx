import { prisma } from "@/lib/prisma";
import { getDefaultCompanyId } from "@/lib/company";
import { upsertBudgetLine } from "@/lib/server/actions";

export default async function BudgetPage() {
  const companyId = await getDefaultCompanyId();
  const now = new Date();
  const y = now.getFullYear();
  const mo = now.getMonth() + 1;

  const accounts = await prisma.glAccount.findMany({
    where: { companyId, isActive: true, type: { in: ["REVENUE", "EXPENSE"] } },
    orderBy: { code: "asc" },
  });

  const lines = await prisma.budgetLine.findMany({
    where: { companyId, year: y },
    include: { glAccount: true },
    orderBy: [{ month: "asc" }, { glAccount: { code: "asc" } }],
  });

  // Mock actuals for demonstration
  const getMockActuals = (amount: number, index: number) => {
    // Generate some realistic looking numbers based on the budget amount
    const spentRatio = [0.4, 0.85, 1.1, 0.1, 0.6][index % 5];
    const pendingRatio = [0.1, 0.05, 0.0, 0.2, 0.15][index % 5];
    
    const spent = amount * spentRatio;
    const pending = amount * pendingRatio;
    const remaining = amount - spent - pending;
    const progress = amount > 0 ? ((spent + pending) / amount) * 100 : 0;
    
    return { spent, pending, remaining, progress };
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">月度預算統計與收支管理 (Budgeting)</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            監控資金使用情況，防止超支。
          </p>
        </div>
        <div className="flex gap-3">
          <button className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900">
            預算調整
          </button>
          <button className="flex items-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            超支預警: 已開啟
          </button>
        </div>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold">預算設定表單</h3>
        <form action={upsertBudgetLine} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm">
            年
            <input
              name="year"
              type="number"
              defaultValue={y}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            />
          </label>
          <label className="text-sm">
            月
            <input
              name="month"
              type="number"
              min={1}
              max={12}
              defaultValue={mo}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            />
          </label>
          <label className="text-sm">
            預算類型
            <select
              name="budgetType"
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              defaultValue="EXPENSE"
            >
              <option value="REVENUE">收入</option>
              <option value="EXPENSE">支出</option>
            </select>
          </label>
          <label className="text-sm">
            費用類別 / 科目
            <select
              name="glAccountId"
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              required
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} {a.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm lg:col-span-2">
            預算上限金額
            <input
              name="amount"
              type="number"
              step="0.01"
              placeholder="例如: 10000"
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm tabular-nums dark:border-zinc-600 dark:bg-zinc-950"
              required
            />
          </label>
          <label className="text-sm lg:col-span-2">
            部門 / 備註
            <input 
              name="note" 
              placeholder="例如: 市場部"
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950" 
            />
          </label>
          <div className="sm:col-span-2 lg:col-span-4 mt-2">
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              保存預算設定
            </button>
          </div>
        </form>
      </section>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="text-sm font-semibold">預算監控表格 ({y}年)</h3>
        </div>
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">月份</th>
              <th className="px-4 py-3">類別 / 部門</th>
              <th className="px-4 py-3 text-right">預算總額</th>
              <th className="px-4 py-3 text-right">已支出(已過審)</th>
              <th className="px-4 py-3 text-right">申請中金額</th>
              <th className="px-4 py-3 text-right">剩餘可用</th>
              <th className="px-4 py-3 w-48">執行進度(%)</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => {
              const amount = Number(l.amount);
              const { spent, pending, remaining, progress } = getMockActuals(amount, i);
              
              let progressColor = "bg-emerald-500";
              if (progress > 100) progressColor = "bg-red-500";
              else if (progress > 80) progressColor = "bg-orange-500";

              return (
                <tr key={l.id} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="px-4 py-3">{l.month}月</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{l.glAccount.name}</div>
                    <div className="text-xs text-zinc-500">{l.note ?? "—"}</div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">${amount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-zinc-600 dark:text-zinc-400">${spent.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-amber-600 dark:text-amber-400">${pending.toFixed(2)}</td>
                  <td className={`px-4 py-3 text-right tabular-nums font-medium ${remaining < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    ${remaining.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${progressColor}`} 
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        ></div>
                      </div>
                      <span className={`text-xs font-medium w-9 text-right ${progress > 100 ? 'text-red-600' : progress > 80 ? 'text-orange-600' : ''}`}>
                        {progress.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {lines.length === 0 ? <p className="p-6 text-center text-sm text-zinc-500">暫無預算數據</p> : null}
      </div>
    </div>
  );
}
