import { prisma } from "@/lib/prisma";
import { getDefaultCompanyId } from "@/lib/company";
import RoleForm from "./RoleForm";
import RoleTable from "./RoleTable";

export default async function RolePermissionsPage() {
  const companyId = await getDefaultCompanyId();
  
  const [roles, permissions] = await Promise.all([
    prisma.role.findMany({
      where: { companyId },
      include: {
        permissions: {
          include: { permission: true },
        },
        _count: {
          select: { users: true },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.permission.findMany({
      orderBy: [
        { resource: "asc" },
        { action: "asc" }
      ]
    })
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">級別權限設定 (RBAC)</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            管理系統中的角色及其對應的權限。
          </p>
        </div>
        <RoleForm permissions={permissions} />
      </div>

      <RoleTable roles={roles} permissions={permissions} />
    </div>
  );
}