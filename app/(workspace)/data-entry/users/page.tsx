import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getDefaultCompanyId } from "@/lib/company";
import { getSession } from "@/lib/auth/session";
import { COMPANY_ROLE_BUSINESS_NAME, COMPANY_ROLE_NAME } from "@/lib/rbac/seed-company-rbac";
import UserForm from "./UserForm";
import UsersTable from "./UsersTable";

export default async function UsersPage() {
  const session = await getSession();
  const companyId = await getDefaultCompanyId();

  const [users, roles, companies, superAdminCount] = await Promise.all([
    prisma.user.findMany({
      where: {
        roles: {
          some: { companyId },
        },
      },
      include: {
        roles: {
          include: {
            role: true,
            company: { select: { id: true, name: true, code: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.role.findMany({
      where: { companyId },
      select: { id: true, name: true },
    }),
    prisma.company.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.count({ where: { isSuperAdmin: true } }),
  ]);

  const userRows = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    isSuperAdmin: u.isSuperAdmin,
    createdAt: u.createdAt.toISOString(),
    roles: u.roles.map((ur) => ({
      companyId: ur.companyId,
      role: { id: ur.role.id, name: ur.role.name },
      company: ur.company,
    })),
  }));

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

      <UsersTable
        users={userRows}
        companies={companies}
        defaultCompanyId={companyId}
        builtinRoleNames={[COMPANY_ROLE_NAME, COMPANY_ROLE_BUSINESS_NAME]}
        currentUserId={session?.sub ?? ""}
        superAdminCount={superAdminCount}
        isPlatformSuperAdmin={session?.isSuperAdmin === true}
      />
    </div>
  );
}