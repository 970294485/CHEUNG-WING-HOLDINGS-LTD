"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Role = { id: string; name: string };
type Company = { id: string; name: string; code: string };

type LoadedRole = {
  companyId: string;
  role: { id: string; name: string };
  company: { id: string; name: string; code: string };
};

type LoadedUser = {
  id: string;
  email: string;
  name: string | null;
  isSuperAdmin: boolean;
  roles: LoadedRole[];
};

export default function UserEditDialog({
  userId,
  open,
  onClose,
  companies,
  defaultCompanyId,
  builtinRoleNames,
  allowSuperAdminFields = true,
}: {
  userId: string | null;
  open: boolean;
  onClose: () => void;
  companies: Company[];
  defaultCompanyId: string;
  builtinRoleNames: string[];
  /** 平台超管才可改「超級管理員」勾選 */
  allowSuperAdminFields?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [user, setUser] = useState<LoadedUser | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [companyId, setCompanyId] = useState(defaultCompanyId);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    isSuperAdmin: false,
    roleIds: [] as string[],
  });

  const selectionUsesBuiltinRole = useMemo(
    () =>
      form.roleIds.some((id) => {
        const r = roles.find((x) => x.id === id);
        return r ? builtinRoleNames.includes(r.name) : false;
      }),
    [form.roleIds, roles, builtinRoleNames]
  );

  const loadRolesForCompany = useCallback(async (cid: string) => {
    const res = await fetch(`/api/roles?companyId=${encodeURIComponent(cid)}`);
    if (!res.ok) {
      setRoles([]);
      return;
    }
    const data = (await res.json()) as Role[];
    setRoles(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    if (!open || !userId) {
      setUser(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setFetching(true);
      try {
        const res = await fetch(`/api/users/${encodeURIComponent(userId)}`);
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          alert(d.error || "載入用戶失敗");
          onClose();
          return;
        }
        const u = (await res.json()) as LoadedUser;
        if (cancelled) return;
        setUser(u);
        setForm({
          name: u.name ?? "",
          email: u.email,
          password: "",
          isSuperAdmin: u.isSuperAdmin,
          roleIds: [],
        });
        const cid = defaultCompanyId;
        setCompanyId(cid);
        await loadRolesForCompany(cid);
        const initialRoleIds = u.roles.filter((r) => r.companyId === cid).map((r) => r.role.id);
        setForm((prev) => ({
          ...prev,
          name: u.name ?? "",
          email: u.email,
          isSuperAdmin: u.isSuperAdmin,
          roleIds: initialRoleIds,
        }));
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, userId, defaultCompanyId, loadRolesForCompany, onClose]);

  const handleCompanyChange = async (cid: string) => {
    setCompanyId(cid);
    setForm((prev) => ({ ...prev, roleIds: [] }));
    await loadRolesForCompany(cid);
    if (user) {
      const next = user.roles.filter((r) => r.companyId === cid).map((r) => r.role.id);
      setForm((prev) => ({ ...prev, roleIds: next }));
    }
  };

  const toggleRole = (roleId: string) => {
    setForm((prev) => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter((id) => id !== roleId)
        : [...prev.roleIds, roleId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    if (form.roleIds.length > 0 && selectionUsesBuiltinRole) {
      if (!companyId.trim()) {
        alert("分配「公司角色」或「公司角色（業務）」時必須選擇所屬公司");
        return;
      }
    }
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim() || null,
        email: form.email.trim(),
      };
      if (allowSuperAdminFields) {
        payload.isSuperAdmin = form.isSuperAdmin;
      }
      if (form.password.trim()) {
        payload.password = form.password;
      }
      if (roles.length > 0) {
        payload.companyId = companyId.trim();
        payload.roleIds = form.roleIds;
      }
      const res = await fetch(`/api/users/${encodeURIComponent(userId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        onClose();
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "更新失敗");
      }
    } catch (err) {
      console.error(err);
      alert("更新失敗");
    } finally {
      setLoading(false);
    }
  };

  if (!open || !userId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900">
        <h3 className="mb-4 text-lg font-semibold">編輯用戶</h3>
        {fetching || !user ? (
          <p className="text-sm text-zinc-500">載入中…</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">用戶名稱</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">登錄郵箱</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">新密碼（留空則不修改）</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="new-password"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>
            {allowSuperAdminFields ? (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isSuperAdmin}
                  onChange={(e) => setForm({ ...form, isSuperAdmin: e.target.checked })}
                  className="rounded border-zinc-300"
                />
                超級管理員
              </label>
            ) : null}

            <div>
              <label className="mb-1 block text-sm font-medium">分配角色（所選公司）</label>
              <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
                以下勾選僅更新「所選公司」內的角色；其他公司的關聯不變。切換公司可編輯另一家公司下的角色。
              </p>
              {roles.length === 0 ? (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
                  該公司尚無角色，請先到「
                  <Link
                    href="/data-entry/role-permissions"
                    className="font-medium underline underline-offset-2"
                    onClick={onClose}
                  >
                    角色管理（RBAC）
                  </Link>
                  」建立。
                </p>
              ) : (
                <>
                  {selectionUsesBuiltinRole ? (
                    <div className="mb-3 space-y-2">
                      <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        所屬公司 <span className="text-red-600">*</span>
                      </label>
                      <select
                        required
                        value={companyId}
                        onChange={(e) => void handleCompanyChange(e.target.value)}
                        className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                      >
                        {companies.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}（{c.code}）
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="mb-3">
                      <label className="mb-1 block text-sm font-medium">公司範圍</label>
                      <select
                        value={companyId}
                        onChange={(e) => void handleCompanyChange(e.target.value)}
                        className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                      >
                        {companies.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}（{c.code}）
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="space-y-2">
                    {roles.map((role) => (
                      <label key={role.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={form.roleIds.includes(role.id)}
                          onChange={() => toggleRole(role.id)}
                          className="rounded border-zinc-300"
                        />
                        <span className="text-sm">{role.name}</span>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "保存中…" : "保存"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
