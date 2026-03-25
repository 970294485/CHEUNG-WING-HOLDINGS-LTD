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
import { Download, Search, FileSpreadsheet } from "lucide-react";

// 模拟报价单数据
const mockQuotations = [
  { id: "QT-2024-001", customer: "科技发展有限公司", date: "2024-03-20", validUntil: "2024-04-20", amount: 15000.0, status: "已确认" },
  { id: "QT-2024-002", customer: "全球贸易集团", date: "2024-03-21", validUntil: "2024-04-21", amount: 28500.0, status: "待确认" },
  { id: "QT-2024-003", customer: "创新科技有限公司", date: "2024-03-22", validUntil: "2024-04-22", amount: 9800.0, status: "已确认" },
  { id: "QT-2024-004", customer: "未来网络", date: "2024-03-23", validUntil: "2024-04-23", amount: 45000.0, status: "已失效" },
  { id: "QT-2024-005", customer: "星辰实业", date: "2024-03-24", validUntil: "2024-04-24", amount: 12000.0, status: "待确认" },
];

export default function QuotationExportPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const filteredQuotations = mockQuotations.filter(
    (quote) =>
      quote.customer.includes(searchTerm) || quote.id.includes(searchTerm)
  );

  const handleExport = () => {
    setIsExporting(true);
    // 模拟导出延迟
    setTimeout(() => {
      setIsExporting(false);
      alert("报价单数据已成功导出为 Excel 文件！");
    }, 1500);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">报价单导出</h1>
          <p className="text-sm text-muted-foreground mt-2">
            管理并导出系统中的报价单数据（支持 Excel 等格式）
          </p>
        </div>
        <Button onClick={handleExport} disabled={isExporting} className="gap-2">
          {isExporting ? (
            <span className="animate-spin">⏳</span>
          ) : (
            <FileSpreadsheet className="h-4 w-4" />
          )}
          {isExporting ? "导出中..." : "导出为 Excel"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>报价单列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索报价单号或客户名称..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Input type="date" className="max-w-[200px]" />
            <span className="text-muted-foreground text-sm">至</span>
            <Input type="date" className="max-w-[200px]" />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>报价单编号</TableHead>
                  <TableHead>客户名称</TableHead>
                  <TableHead>报价日期</TableHead>
                  <TableHead>有效期至</TableHead>
                  <TableHead className="text-right">总金额 (¥)</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotations.length > 0 ? (
                  filteredQuotations.map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell className="font-medium">{quote.id}</TableCell>
                      <TableCell>{quote.customer}</TableCell>
                      <TableCell>{quote.date}</TableCell>
                      <TableCell>{quote.validUntil}</TableCell>
                      <TableCell className="text-right">
                        {quote.amount.toLocaleString("zh-CN", {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            quote.status === "已确认"
                              ? "bg-green-100 text-green-700"
                              : quote.status === "待确认"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {quote.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Download className="h-4 w-4" />
                          下载 PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      没有找到匹配的报价单记录
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
