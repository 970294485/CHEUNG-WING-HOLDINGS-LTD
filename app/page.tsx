import { redirect } from "next/navigation";
import { loginAction } from "@/lib/auth/actions";
import { getSession } from "@/lib/auth/session";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; from?: string }>;
}) {
  const session = await getSession();
  if (session?.sub) redirect("/dashboard");

  const sp = await searchParams;
  const hasError = sp.error === "1";

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-zinc-950">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-center text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Cheung Wing Holdings Limited
        </h1>
        <p className="mt-2 text-center text-sm text-zinc-500">使用賬號進入各功能板塊</p>

        {hasError ? (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-center text-sm text-red-800 dark:bg-red-950/50 dark:text-red-200">
            郵箱或密碼錯誤
          </p>
        ) : null}

        <form action={loginAction} className="mt-6 space-y-4">
          <input type="hidden" name="from" value={sp.from ?? ""} />
          <label className="block text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">郵箱</span>
            <input
              name="email"
              type="email"
              autoComplete="username"
              required
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              placeholder=""
            />
          </label>
          <label className="block text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">密碼</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            登錄
          </button>
        </form>

      </div>
    </div>
  );
}
