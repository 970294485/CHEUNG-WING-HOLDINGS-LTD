"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Search, ExternalLink, FileText } from "lucide-react";
import Link from "next/link";

interface SalesDocument {
  id: string;
  type: "QUOTATION" | "CONTRACT" | "PROFORMA_INVOICE";
  documentNo: string;
  customerId: string;
  date: string;
  dueDate: string | null;
  totalAmount: number;
  status: string;
  customer: {
    name: string;
  };
}

export default function QuotesContractsPage() {
  const [documents, setDocuments] = useState<SalesDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");

  const fetchDocuments = async () => {
    try {
      // Fetch both quotations and contracts
      const res = await fetch(`/api/sales-documents`);
      if (res.ok) {
        const data = await res.json();
        // Filter out proforma invoices as this page is only for quotes and contracts
        setDocuments(data.filter((doc: SalesDocument) => doc.type === "QUOTATION" || doc.type === "CONTRACT"));
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("確定要刪除此單據嗎？")) return;

    try {
      const res = await fetch(`/api/sales-documents/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchDocuments();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to delete document");
      }
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  const filteredDocuments = documents.filter(
    (doc) => {
      const matchesSearch = doc.documentNo.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (doc.customer?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === "ALL" || doc.type === filterType;
      return matchesSearch && matchesType;
    }
  );

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "QUOTATION": return "報價單";
      case "CONTRACT": return "合同";
      default: return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT": return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">草稿</span>;
      case "PENDING": return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">待處理</span>;
      case "CONFIRMED": return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">已確認</span>;
      case "CANCELLED": return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">已取消</span>;
      case "COMPLETED": return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">已完成</span>;
      default: return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">報價單和合同</h1>
          <p className="text-muted-foreground">集中管理所有報價單與合同資料。與 <Link href="/sales/quotes" className="text-blue-500 hover:underline">銷售功能</Link> 模組數據互通。</p>
        </div>
        <div className="flex space-x-2">
          <Link href="/sales/quotes">
            <Button variant="outline">
              <ExternalLink className="mr-2 h-4 w-4" /> 報價管理
            </Button>
          </Link>
          <Link href="/sales/contracts">
            <Button variant="outline">
              <ExternalLink className="mr-2 h-4 w-4" /> 合同管理
            </Button>
          </Link>
          <Link href="/customers/sales-orders">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> 新增單據
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜尋單號或客戶名稱..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-48">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue placeholder="單據類型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">全部類型</SelectItem>
              <SelectItem value="QUOTATION">報價單</SelectItem>
              <SelectItem value="CONTRACT">合同</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>單號</TableHead>
              <TableHead>類型</TableHead>
              <TableHead>客戶</TableHead>
              <TableHead>日期</TableHead>
              <TableHead className="text-right">總金額</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  載入中...
                </TableCell>
              </TableRow>
            ) : filteredDocuments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  找不到單據資料
                </TableCell>
              </TableRow>
            ) : (
              filteredDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium font-mono">{doc.documentNo}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      doc.type === 'QUOTATION' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}>
                      {getTypeLabel(doc.type)}
                    </span>
                  </TableCell>
                  <TableCell>{doc.customer?.name || "-"}</TableCell>
                  <TableCell>{new Date(doc.date).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right tabular-nums">${Number(doc.totalAmount).toFixed(2)}</TableCell>
                  <TableCell>{getStatusBadge(doc.status)}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/customers/sales-orders?id=${doc.id}`}>
                      <Button variant="ghost" size="icon" title="檢視/編輯詳情">
                        <FileText className="h-4 w-4 text-blue-500" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)} title="刪除單據">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
