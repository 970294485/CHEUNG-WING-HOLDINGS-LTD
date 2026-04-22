"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  emptyCustomerForm,
  newCustomerDefaultsFromInvoice202500062,
} from "@/lib/customers/new-customer-invoice-defaults";

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params?.id ?? "");
  const isNew = id === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState(() => {
    const base = emptyCustomerForm();
    if (isNew) {
      return { ...base, ...newCustomerDefaultsFromInvoice202500062() };
    }
    return base;
  });

  const fetchCustomer = useCallback(async (customerId: string) => {
    try {
      const res = await fetch(`/api/customers/${customerId}`);
      if (res.ok) {
        const data = await res.json();
        setFormData({
          name: data.name || "",
          code: data.code || "",
          contactPerson: data.contactPerson || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          taxId: data.taxId || "",
          source: data.source || "",
          status: data.status || "ACTIVE",
          groupId: data.groupId || "",
          followUps: data.followUps || [],
        });
      }
    } catch (error) {
      console.error("Failed to fetch customer:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id === "new") {
      setFormData({ ...emptyCustomerForm(), ...newCustomerDefaultsFromInvoice202500062() });
      setLoading(false);
      return;
    }
    setLoading(true);
    void fetchCustomer(id);
  }, [id, fetchCustomer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = isNew ? "/api/customers" : `/api/customers/${id}`;
      const method = isNew ? "POST" : "PUT";
      
      const payload = {
        name: formData.name,
        code: formData.code,
        contactPerson: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        taxId: formData.taxId,
        source: formData.source,
        status: formData.status,
        groupId: formData.groupId,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push("/customers/list");
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Failed to save customer:", error);
      alert("儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isNew) return;
    const ok = window.confirm(
      `確定要刪除客戶「${formData.name || id}」嗎？\n\n將一併刪除其銷售單據（報價／合同／預收發票）及跟進記錄；預收／應收關聯會解除。此操作無法還原。`
    );
    if (!ok) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/customers/list");
        router.refresh();
        return;
      }
      const body = await res.json().catch(() => ({}));
      alert(typeof body?.error === "string" ? body.error : "刪除失敗");
    } catch {
      alert("刪除失敗");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="p-6">載入中...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            {isNew ? "新增客戶" : "編輯客戶"}
          </h1>
          {isNew ? (
            <p className="mt-1 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
              已預填發票 202500062 的買方資料，可直接修改後儲存。
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => router.back()}
          className="shrink-0 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
        >
          返回列表
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 shadow-sm rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                客戶名稱 *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                客戶編號
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                聯絡人
              </label>
              <input
                type="text"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                聯絡電話
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                電子郵件
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                稅號 (Tax ID)
              </label>
              <input
                type="text"
                name="taxId"
                value={formData.taxId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                地址
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                客戶來源
              </label>
              <select
                name="source"
                value={formData.source}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
              >
                <option value="">請選擇來源</option>
                <option value="展會">展會</option>
                <option value="官網">官網</option>
                <option value="推薦">推薦</option>
                <option value="發票提取">發票提取</option>
                <option value="其他">其他</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                狀態
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
              >
                <option value="ACTIVE">活躍</option>
                <option value="INACTIVE">非活躍</option>
                <option value="LEAD">潛在客戶</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
            {!isNew ? (
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleting || saving}
                className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-200 rounded-md hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-950/40"
              >
                {deleting ? "刪除中…" : "刪除客戶"}
              </button>
            ) : (
              <span />
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-600 dark:hover:bg-zinc-700"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-md hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {saving ? "儲存中..." : "儲存"}
              </button>
            </div>
          </div>
        </form>
      </div>
      
      {!isNew && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">跟進記錄 (時間軸)</h2>
          <div className="bg-white dark:bg-zinc-900 shadow-sm rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const content = (form.elements.namedItem('content') as HTMLInputElement).value;
                const type = (form.elements.namedItem('type') as HTMLSelectElement).value;
                
                if (!content) return;
                
                try {
                  const res = await fetch(`/api/customers/${id}/follow-ups`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content, type })
                  });
                  if (res.ok) {
                    form.reset();
                    void fetchCustomer(id);
                  }
                } catch (error) {
                  console.error(error);
                }
              }}
              className="mb-6 flex gap-4"
            >
              <select name="type" className="px-3 py-2 border border-zinc-300 rounded-md dark:bg-zinc-800 dark:border-zinc-700">
                <option value="NOTE">筆記</option>
                <option value="PHONE">電話</option>
                <option value="EMAIL">郵件</option>
                <option value="MEETING">會議</option>
              </select>
              <input 
                type="text" 
                name="content" 
                placeholder="新增跟進記錄..." 
                className="flex-1 px-3 py-2 border border-zinc-300 rounded-md dark:bg-zinc-800 dark:border-zinc-700"
              />
              <button type="submit" className="bg-zinc-900 text-white px-4 py-2 rounded-md dark:bg-white dark:text-zinc-900">
                新增
              </button>
            </form>

            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-300 before:to-transparent">
              {/* Timeline items will be rendered here. For now, we assume followUps is in the customer data */}
              {/* @ts-ignore */}
              {formData.followUps?.map((fu: any) => (
                <div key={fu.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-zinc-200 text-zinc-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 dark:bg-zinc-800 dark:border-zinc-800">
                    <span className="text-xs">{fu.type === 'PHONE' ? '📞' : fu.type === 'EMAIL' ? '✉️' : fu.type === 'MEETING' ? '🤝' : '📝'}</span>
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-zinc-200 bg-white dark:bg-zinc-800 dark:border-zinc-700 shadow">
                    <div className="flex items-center justify-between space-x-2 mb-1">
                      <div className="font-bold text-zinc-900 dark:text-white">{fu.type}</div>
                      <time className="font-caveat font-medium text-zinc-500">{new Date(fu.date).toLocaleString()}</time>
                    </div>
                    <div className="text-zinc-700 dark:text-zinc-300">{fu.content}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
