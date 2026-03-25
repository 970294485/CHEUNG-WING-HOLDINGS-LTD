"use client";

import { useState } from "react";

export default function EmailPromotionPage() {
  const [sending, setSending] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    // Simulate sending email
    setTimeout(() => {
      alert("推廣郵件已成功發送！");
      setSending(false);
    }, 1500);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">發送推廣訊息 (Email)</h1>
      
      <div className="bg-white dark:bg-zinc-900 shadow-sm rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
        <form onSubmit={handleSend} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              收件人 (客戶群組)
            </label>
            <select className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white">
              <option value="all">所有活躍客戶</option>
              <option value="vip">VIP 客戶</option>
              <option value="lead">潛在客戶</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              郵件主旨
            </label>
            <input
              type="text"
              required
              placeholder="例如：最新產品優惠..."
              className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              郵件內容
            </label>
            <textarea
              required
              rows={8}
              placeholder="請輸入推廣內容..."
              className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
            ></textarea>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sending}
              className="bg-zinc-900 text-white px-6 py-2 rounded-md hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {sending ? "發送中..." : "發送郵件"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
