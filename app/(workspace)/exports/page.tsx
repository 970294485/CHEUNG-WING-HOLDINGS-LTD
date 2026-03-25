"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, FileSpreadsheet, Download, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ExportsPage() {
  const [exportType, setExportType] = useState("invoice");

  const exportOptions = [
    { id: "invoice", name: "發票 (Invoice)", desc: "導出已開具的正式發票和預收發票" },
    { id: "quotation", name: "報價單 (Quotation)", desc: "導出發送給客戶的報價單據" },
    { id: "delivery", name: "送貨單 (Delivery Note)", desc: "導出出庫送貨憑證" },
    { id: "payment", name: "付款請求 (Payment Request)", desc: "導出財務請款與付款單據" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">全局導出中心</h1>
        <p className="text-muted-foreground">統一管理和導出系統內的各類業務單據（支持 PDF 和 Excel 格式）。</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>選擇導出類型</CardTitle>
            <CardDescription>請選擇您需要導出的單據類型及時間範圍</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">單據類型</label>
              <Select value={exportType} onValueChange={setExportType}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇單據類型" />
                </SelectTrigger>
                <SelectContent>
                  {exportOptions.map(opt => (
                    <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">時間範圍</label>
              <Select defaultValue="this_month">
                <SelectTrigger>
                  <SelectValue placeholder="選擇時間範圍" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">今天</SelectItem>
                  <SelectItem value="this_week">本週</SelectItem>
                  <SelectItem value="this_month">本月</SelectItem>
                  <SelectItem value="last_month">上個月</SelectItem>
                  <SelectItem value="this_year">本年度</SelectItem>
                  <SelectItem value="custom">自定義範圍...</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">狀態過濾</label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="選擇狀態" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部狀態</SelectItem>
                  <SelectItem value="completed">已完成 / 已審批</SelectItem>
                  <SelectItem value="pending">待處理 / 待審批</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>執行導出</CardTitle>
            <CardDescription>選擇導出格式並生成文件</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-md bg-muted p-4">
              <h4 className="text-sm font-medium mb-2">當前選擇摘要：</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• 類型：{exportOptions.find(o => o.id === exportType)?.name}</li>
                <li>• 範圍：本月</li>
                <li>• 狀態：全部狀態</li>
                <li>• 預估數據量：約 128 條記錄</li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <Button className="w-full flex items-center justify-center gap-2" size="lg">
                <FileText className="h-5 w-5" />
                導出為 PDF (標準打印格式)
              </Button>
              <Button variant="outline" className="w-full flex items-center justify-center gap-2" size="lg">
                <FileSpreadsheet className="h-5 w-5 text-green-600" />
                導出為 Excel (數據分析格式)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
