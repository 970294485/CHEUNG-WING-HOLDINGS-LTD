export function SectionPlaceholder({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{title}</h1>
      {subtitle ? (
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{subtitle}</p>
      ) : null}
      <div className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/80 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400">
        導航與信息架構已就緒，業務功能待實現。
      </div>
    </div>
  );
}
