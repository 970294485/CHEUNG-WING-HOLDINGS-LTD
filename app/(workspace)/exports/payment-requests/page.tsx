"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Search, FileSpreadsheet, CreditCard } from "lucide-react";

// 模擬付款請求數據
const mockPaymentRequests = [
  { id: "PR-2024-001", title: "採購服務器設備尾款", department: "IT部", applicant: "張三", date: "2024-03-20", amount: 45000.0, status: "已支付" },
  { id: "PR-2024-002", title: "第一季度辦公室租金", department: "行政部", applicant: "李四", date: "2024-03-21", amount: 120000.0, status: "待審批" },
  { id: "PR-2024-003", title: "年度營銷活動推廣費", department: "市場部", applicant: "王五", date: "2024-03-22", amount: 35000.0, status: "已審批" },
  { id: "PR-2024-004", title: "員工差旅報銷", department: "銷售部", applicant: "趙六", date: "2024-03-23", amount: 4500.0, status: "已駁回" },
  { id: "PR-2024-005", title: "外部顧問諮詢費", department: "法務部", applicant: "孫七", date: "2024-03-24", amount: 15000.0, status: "待審批" },
];

export default function PaymentRequestsExportPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const filteredRequests = mockPaymentRequests.filter(
    (request) =>
      request.title.includes(searchTerm) || 
      request.id.includes(searchTerm) ||
      request.applicant.includes(searchTerm) ||
      request.department.includes(searchTerm)
  );

  const handleExport = () => {
    setIsExporting(true);
    // 模擬導出延遲
    setTimeout(() => {
      setIsExporting(false);
      alert("付款請求數據已成功導出為 Excel 文件！");
    }, 1500);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">付款請求導出</h1>
          <p className="text-sm text-muted-foreground mt-2">
            管理並導出系統中的付款請求及報銷數據（支持 Excel 等格式）
          </p>
        </div>
        <Button onClick={handleExport} disabled={isExporting} className="gap-2">
          {isExporting ? (
            <span className="animate-spin">⏳</span>
          ) : (
            <FileSpreadsheet className="h-4 w-4" />
          )}
          {isExporting ? "導出中..." : "導出為 Excel"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>付款請求列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索請求編號、事由、申請人或部門..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Input type="date" className="max-w-[180px]" />
            <span className="text-muted-foreground text-sm">至</span>
            <Input type="date" className="max-w-[180px]" />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>請求編號</TableHead>
                  <TableHead>付款事由</TableHead>
                  <TableHead>申請部門</TableHead>
                  <TableHead>申請人</TableHead>
                  <TableHead>申請日期</TableHead>
                  <TableHead className="text-right">金額 (¥)</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length > 0 ? (
                  filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          {request.id}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={request.title}>
                        {request.title}
                      </TableCell>
                      <TableCell>{request.department}</TableCell>
                      <TableCell>{request.applicant}</TableCell>
                      <TableCell>{request.date}</TableCell>
                      <TableCell className="text-right">
                        {request.amount.toLocaleString("zh-CN", {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            request.status === "已支付"
                              ? "bg-green-100 text-green-700"
                              : request.status === "已審批"
                              ? "bg-blue-100 text-blue-700"
                              : request.status === "待審批"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {request.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Download className="h-4 w-4" />
                          下載單據
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      沒有找到匹配的付款請求記錄
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
