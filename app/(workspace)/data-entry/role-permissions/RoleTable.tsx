"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RoleForm from "./RoleForm";

type Permission = {
  id: string;
  action: string;
  resource: string;
  description: string | null;
};

type Role = {
  id: string;
  name: string;
  description: string | null;
  permissions: { permission: Permission }[];
  _count: { users: number };
};

export default function RoleTable({
  roles,
  permissions,
}: {
  roles: Role[];
  permissions: Permission[];
}) {
  const router = useRouter();
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (role: Role) => {
    if (role._count.users > 0) {
      alert("無法刪除：該角色已有用戶關聯");
      return;
    }
    
    if (!confirm(`確定要刪除角色 "${role.name}" 嗎？`)) {
      return;
    }

    setDeletingId(role.id);
    try {
      const res = await fetch(`/api/roles/${role.id}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "刪除失敗");
      }
    } catch (error) {
      console.error(error);
      alert("刪除失敗");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">角色名稱</th>
              <th className="px-4 py-3">描述</th>
              <th className="px-4 py-3">權限列表</th>
              <th className="px-4 py-3">關聯用戶數</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.id} className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="px-4 py-3 font-medium">{role.name}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{role.description || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.map((rp) => (
                      <span
                        key={rp.permission.id}
                        className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                        title={rp.permission.description || ""}
                      >
                        {rp.permission.action}:{rp.permission.resource}
                      </span>
                    ))}
                    {role.permissions.length === 0 && <span className="text-zinc-400">無權限</span>}
                  </div>
                </td>
                <td className="px-4 py-3">{role._count.users}</td>
                <td className="px-4 py-3 text-right space-x-3">
                  <button 
                    onClick={() => setEditingRole(role)}
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    編輯
                  </button>
                  <button 
                    onClick={() => handleDelete(role)}
                    disabled={deletingId === role.id || role._count.users > 0}
                    className="text-red-600 hover:underline dark:text-red-400 disabled:opacity-50 disabled:no-underline"
                    title={role._count.users > 0 ? "已有用戶關聯，無法刪除" : ""}
                  >
                    {deletingId === role.id ? "刪除中..." : "刪除"}
                  </button>
                </td>
              </tr>
            ))}
            {roles.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                  暫無角色數據
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingRole && (
        <RoleForm 
          permissions={permissions} 
          existingRole={editingRole} 
          onClose={() => setEditingRole(null)} 
        />
      )}
    </>
  );
}
