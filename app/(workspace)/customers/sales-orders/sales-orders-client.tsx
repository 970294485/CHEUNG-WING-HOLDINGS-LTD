"use client";

import { useState } from "react";
import { Plus, Search, FileText, FileSignature, Receipt, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";
import { SalesOrderDialog } from "./sales-order-dialog";
import { deleteSalesDocument, updateSalesDocumentStatus } from "./actions";

type SalesDocumentType = "QUOTATION" | "CONTRACT" | "PROFORMA_INVOICE";
type SalesDocumentStatus = "DRAFT" | "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

const TYPE_LABELS: Record<SalesDocumentType, { label: string; icon: React.ElementType; color: string }> = {
  QUOTATION: { label: "報價單", icon: FileText, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400" },
  CONTRACT: { label: "合同", icon: FileSignature, color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400" },
  PROFORMA_INVOICE: { label: "預收發票", icon: Receipt, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400" },
};

const STATUS_LABELS: Record<SalesDocumentStatus, { label: string; color: string }> = {
  DRAFT: { label: "草稿", color: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
  PENDING: { label: "待處理", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  CONFIRMED: { label: "已確認", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  COMPLETED: { label: "已完成", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  CANCELLED: { label: "已取消", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

export function SalesOrdersClient({ documents, customers, products }: { 
  documents: any[], 
  customers: any[], 
  products: any[] 
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = 
      doc.documentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.customer?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "ALL" || doc.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleDelete = async (id: string) => {
    if (confirm("確定要刪除此單據嗎？")) {
      await deleteSalesDocument(id);
    }
  };

  const handleStatusChange = async (id: string, newStatus: SalesDocumentStatus) => {
    await updateSalesDocumentStatus(id, newStatus);
  };

  const openCreateDialog = () => {
    setSelectedDoc(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (doc: any) => {
    setSelectedDoc(doc);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="搜尋單號或客戶..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 w-full rounded-md border border-zinc-200 bg-white pl-9 pr-4 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-100 dark:focus:ring-zinc-100"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-100 dark:focus:ring-zinc-100"
          >
            <option value="ALL">全部類型</option>
            <option value="QUOTATION">報價單</option>
            <option value="CONTRACT">合同</option>
            <option value="PROFORMA_INVOICE">預收發票</option>
          </select>
        </div>
        <button
          onClick={openCreateDialog}
          className="inline-flex h-9 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-zinc-50 shadow transition-colors hover:bg-zinc-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90 dark:focus-visible:ring-zinc-300"
        >
          <Plus className="mr-2 h-4 w-4" />
          新增單據
        </button>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-800/50">
              <tr>
                <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">類型/單號</th>
                <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">客戶</th>
                <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">日期</th>
                <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">總金額</th>
                <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">狀態</th>
                <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                    找不到符合條件的單據
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => {
                  const typeInfo = TYPE_LABELS[doc.type as SalesDocumentType];
                  const statusInfo = STATUS_LABELS[doc.status as SalesDocumentStatus];
                  const Icon = typeInfo.icon;

                  return (
                    <tr key={doc.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-md ${typeInfo.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium">{doc.documentNo}</div>
                            <div className="text-xs text-zinc-500">{typeInfo.label}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {doc.customer?.name || "未知客戶"}
                      </td>
                      <td className="px-4 py-3 text-zinc-500">
                        {format(new Date(doc.date), "yyyy-MM-dd")}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        ¥{doc.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={doc.status}
                          onChange={(e) => handleStatusChange(doc.id, e.target.value as SalesDocumentStatus)}
                          className={`text-xs font-medium px-2.5 py-1 rounded-full border-none outline-none cursor-pointer ${statusInfo.color}`}
                        >
                          <option value="DRAFT">草稿</option>
                          <option value="PENDING">待處理</option>
                          <option value="CONFIRMED">已確認</option>
                          <option value="COMPLETED">已完成</option>
                          <option value="CANCELLED">已取消</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditDialog(doc)}
                            className="p-1.5 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 rounded-md dark:hover:bg-blue-900/30 transition-colors"
                            title="編輯"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-md dark:hover:bg-red-900/30 transition-colors"
                            title="刪除"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isDialogOpen && (
        <SalesOrderDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          customers={customers}
          products={products}
          initialData={selectedDoc}
        />
      )}
    </div>
  );
}
