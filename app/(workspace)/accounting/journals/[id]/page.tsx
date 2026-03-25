import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getDefaultCompanyId } from "@/lib/company";
import { deleteJournalForm, postJournalForm } from "@/lib/server/actions";

export default async function JournalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const companyId = await getDefaultCompanyId();
  const entry = await prisma.journalEntry.findFirst({
    where: { id, companyId },
    include: {
      lines: {
        include: {
          glAccount: true,
          accountingCategory: true,
        },
      },
    },
  });
  if (!entry) notFound();

  let td = 0;
  let tc = 0;
  for (const l of entry.lines) {
    td += Number(l.debit);
    tc += Number(l.credit);
  }
  const balanced = Math.abs(td - tc) < 0.0001;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/accounting/journals" className="text-sm text-zinc-500 hover:underline">
            ← 憑證列表
          </Link>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight font-mono">{entry.entryNo}</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {entry.entryDate.toLocaleDateString("zh-CN")} · {entry.status === "POSTED" ? "已過帳" : "草稿"}
          </p>
        </div>
        {entry.status === "DRAFT" ? (
          <div className="flex flex-wrap gap-2">
            <form action={postJournalForm}>
              <input type="hidden" name="id" value={entry.id} />
              <button
                type="submit"
                disabled={!balanced}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                過帳
              </button>
            </form>
            <form action={deleteJournalForm}>
              <input type="hidden" name="id" value={entry.id} />
              <button
                type="submit"
                className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 dark:border-red-900 dark:text-red-300"
              >
                刪除草稿
              </button>
            </form>
          </div>
        ) : null}
      </div>

      {!balanced ? (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
          借貸不平衡，無法過帳（借 {td.toFixed(2)} / 貸 {tc.toFixed(2)}）。
        </p>
      ) : null}

      {entry.description ? (
        <p className="text-sm text-zinc-700 dark:text-zinc-300">{entry.description}</p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">科目</th>
              <th className="px-4 py-3">類別</th>
              <th className="px-4 py-3 text-right">借方</th>
              <th className="px-4 py-3 text-right">貸方</th>
              <th className="px-4 py-3">備註</th>
            </tr>
          </thead>
          <tbody>
            {entry.lines.map((l) => (
              <tr key={l.id} className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="px-4 py-3">
                  {l.glAccount.code} {l.glAccount.name}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {l.accountingCategory?.code ?? "—"}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{l.debit.toFixed(2)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{l.credit.toFixed(2)}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{l.memo ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
