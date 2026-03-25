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

// 模拟付款请求数据
const mockPaymentRequests = [
  { id: "PR-2024-001", title: "采购服务器设备尾款", department: "IT部", applicant: "张三", date: "2024-03-20", amount: 45000.0, status: "已支付" },
  { id: "PR-2024-002", title: "第一季度办公室租金", department: "行政部", applicant: "李四", date: "2024-03-21", amount: 120000.0, status: "待审批" },
  { id: "PR-2024-003", title: "年度营销活动推广费", department: "市场部", applicant: "王五", date: "2024-03-22", amount: 35000.0, status: "已审批" },
  { id: "PR-2024-004", title: "员工差旅报销", department: "销售部", applicant: "赵六", date: "2024-03-23", amount: 4500.0, status: "已驳回" },
  { id: "PR-2024-005", title: "外部顾问咨询费", department: "法务部", applicant: "孙七", date: "2024-03-24", amount: 15000.0, status: "待审批" },
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
    // 模拟导出延迟
    setTimeout(() => {
      setIsExporting(false);
      alert("付款请求数据已成功导出为 Excel 文件！");
    }, 1500);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">付款请求导出</h1>
          <p className="text-sm text-muted-foreground mt-2">
            管理并导出系统中的付款请求及报销数据（支持 Excel 等格式）
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
          <CardTitle>付款请求列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索请求编号、事由、申请人或部门..."
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
                  <TableHead>请求编号</TableHead>
                  <TableHead>付款事由</TableHead>
                  <TableHead>申请部门</TableHead>
                  <TableHead>申请人</TableHead>
                  <TableHead>申请日期</TableHead>
                  <TableHead className="text-right">金额 (¥)</TableHead>
                  <TableHead>状态</TableHead>
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
                              : request.status === "已审批"
                              ? "bg-blue-100 text-blue-700"
                              : request.status === "待审批"
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
                          下载单据
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      没有找到匹配的付款请求记录
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
