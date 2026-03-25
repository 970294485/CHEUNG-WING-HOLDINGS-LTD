"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
};

export default function RoleForm({
  permissions,
  existingRole,
  onClose,
}: {
  permissions: Permission[];
  existingRole?: Role;
  onClose?: () => void;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(!!existingRole);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: existingRole?.name || "",
    description: existingRole?.description || "",
    permissionIds: existingRole?.permissions.map((p) => p.permission.id) || ([] as string[]),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = existingRole ? `/api/roles/${existingRole.id}` : "/api/roles";
      const method = existingRole ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        if (!existingRole) {
          setIsOpen(false);
          setFormData({ name: "", description: "", permissionIds: [] });
        }
        if (onClose) onClose();
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save role");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to save role");
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permissionId: string) => {
    setFormData((prev) => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permissionId)
        ? prev.permissionIds.filter((id) => id !== permissionId)
        : [...prev.permissionIds, permissionId],
    }));
  };

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  if (!isOpen && !existingRole) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        添加角色
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900 max-h-[90vh] flex flex-col">
        <h3 className="mb-4 text-lg font-semibold">
          {existingRole ? "編輯角色" : "添加新角色"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-2">
          <div>
            <label className="mb-1 block text-sm font-medium">角色名稱</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              rows={3}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">分配權限</label>
            <div className="space-y-2 max-h-60 overflow-y-auto rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
              {permissions.map((perm) => (
                <label key={perm.id} className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.permissionIds.includes(perm.id)}
                    onChange={() => togglePermission(perm.id)}
                    className="mt-1 rounded border-zinc-300"
                  />
                  <div>
                    <div className="text-sm font-medium">
                      {perm.action}:{perm.resource}
                    </div>
                    {perm.description && (
                      <div className="text-xs text-zinc-500">{perm.description}</div>
                    )}
                  </div>
                </label>
              ))}
              {permissions.length === 0 && (
                <div className="text-sm text-zinc-500">暫無可用權限</div>
              )}
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "保存中..." : "保存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
