import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getDefaultCompanyId } from "@/lib/company";
import UserForm from "./UserForm";

export default async function UsersPage() {
  const companyId = await getDefaultCompanyId();
  
  const [users, roles] = await Promise.all([
    prisma.user.findMany({
      where: {
        roles: {
          some: { companyId },
        },
      },
      include: {
        roles: {
          where: { companyId },
          include: { role: true },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.role.findMany({
      where: { companyId },
      select: { id: true, name: true },
    })
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">用戶資料輸入</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            管理系統用戶並分配角色。維護角色與權限矩陣請至
            <Link
              href="/data-entry/role-permissions"
              className="mx-1 font-medium text-blue-600 underline underline-offset-2 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              角色權限管理
            </Link>
            。
          </p>
        </div>
        <UserForm roles={roles} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">用戶名稱</th>
              <th className="px-4 py-3">登錄郵箱</th>
              <th className="px-4 py-3">分配角色</th>
              <th className="px-4 py-3">創建時間</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="px-4 py-3 font-medium">{user.name || "—"}</td>
                <td className="px-4 py-3 font-mono text-zinc-600 dark:text-zinc-400">{user.email}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {user.roles.map((ur) => (
                      <span
                        key={ur.role.id}
                        className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      >
                        {ur.role.name}
                      </span>
                    ))}
                    {user.roles.length === 0 && <span className="text-zinc-400">無角色</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="text-blue-600 hover:underline dark:text-blue-400">編輯</button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                  暫無用戶數據
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}