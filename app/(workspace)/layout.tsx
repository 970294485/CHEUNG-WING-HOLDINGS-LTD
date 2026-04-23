import { AppSidebar } from "@/components/app-sidebar";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.sub) redirect("/");
  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <AppSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <main className="min-h-0 flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
        <footer className="border-t border-zinc-200 py-4 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          &copy; {new Date().getFullYear()} Cheung Wing Holdings Limited 版權所有
        </footer>
      </div>
    </div>
  );
}
