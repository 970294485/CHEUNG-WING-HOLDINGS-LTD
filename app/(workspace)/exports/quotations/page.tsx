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

/** 報價單列表資料源；可改為對接真實 API / 與銷售模塊一致 */
const mockQuotations: {
  id: string;
  customer: string;
  date: string;
  validUntil: string;
  amount: number;
  status: string;
}[] = [];

export default function QuotationExportPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const filteredQuotations = mockQuotations.filter(
    (quote) =>
      quote.customer.includes(searchTerm) || quote.id.includes(searchTerm)
  );

  const handleExport = () => {
    setIsExporting(true);
    // 模擬導出延遲
    setTimeout(() => {
      setIsExporting(false);
      alert("報價單數據已成功導出為 Excel 文件！");
    }, 1500);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">報價單導出</h1>
          <p className="text-sm text-muted-foreground mt-2">
            管理並導出系統中的報價單數據（支持 Excel 等格式）
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
          <CardTitle>報價單列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索報價單號或客戶名稱..."
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
                  <TableHead>報價單編號</TableHead>
                  <TableHead>客戶名稱</TableHead>
                  <TableHead>報價日期</TableHead>
                  <TableHead>有效期至</TableHead>
                  <TableHead className="text-right">總金額 (¥)</TableHead>
                  <TableHead>狀態</TableHead>
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
                        {quote.amount.toLocaleString("zh-TW", {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            quote.status === "已確認"
                              ? "bg-green-100 text-green-700"
                              : quote.status === "待確認"
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
                          下載 PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      沒有找到匹配的報價單記錄
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
