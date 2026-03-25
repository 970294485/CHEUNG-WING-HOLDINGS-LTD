import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getDefaultCompanyId } from "@/lib/company";

export default async function JournalsPage() {
  const companyId = await getDefaultCompanyId();
  const entries = await prisma.journalEntry.findMany({
    where: { companyId },
    orderBy: [{ entryDate: "desc" }, { entryNo: "desc" }],
    include: {
      lines: { include: { glAccount: { select: { code: true, name: true } } } },
    },
    take: 80,
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">會計憑證</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">草稿可刪除；過帳後參與總帳與報表。</p>
        </div>
        <Link
          href="/accounting/journals/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          新建憑證
        </Link>
      </div>
      <div className="space-y-4">
        {entries.map((e) => {
          const href = "/accounting/journals/" + e.id;
          const posted = e.status === "POSTED";
          const badge = posted
            ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
            : "rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-100";
          const label = posted ? "已過帳" : "草稿";
          return (
            <article
              key={e.id}
              className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex flex-wrap items-baseline gap-3">
                <Link href={href} className="font-mono text-sm font-semibold hover:underline">
                  {e.entryNo}
                </Link>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  {e.entryDate.toLocaleDateString("zh-CN")}
                </span>
                <span className={badge}>{label}</span>
              </div>
              {e.description ? (
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{e.description}</p>
              ) : null}
              <table className="mt-3 w-full text-sm">
                <tbody>
                  {e.lines.map((l) => (
                    <tr key={l.id} className="border-t border-zinc-100 dark:border-zinc-800">
                      <td className="py-2 pr-2">
                        {l.glAccount.code} {l.glAccount.name}
                      </td>
                      <td className="py-2 pr-2 text-right tabular-nums text-zinc-600 dark:text-zinc-400">
                        {l.debit.gt(0) ? l.debit.toFixed(2) : ""}
                      </td>
                      <td className="py-2 text-right tabular-nums text-zinc-600 dark:text-zinc-400">
                        {l.credit.gt(0) ? l.credit.toFixed(2) : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          );
        })}
      </div>
    </div>
  );
}
