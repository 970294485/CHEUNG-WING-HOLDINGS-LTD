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
import { Download, Search, FileSpreadsheet, Truck } from "lucide-react";

// 模拟送货单数据
const mockDeliveryNotes = [
  { id: "DN-2024-001", orderId: "SO-2024-089", customer: "科技发展有限公司", date: "2024-03-20", address: "北京市海淀区科技园1号", status: "已送达" },
  { id: "DN-2024-002", orderId: "SO-2024-090", customer: "全球贸易集团", date: "2024-03-21", address: "上海市朝阳区贸易大厦5层", status: "配送中" },
  { id: "DN-2024-003", orderId: "SO-2024-092", customer: "创新科技有限公司", date: "2024-03-22", address: "深圳市浦东新区创新路8号", status: "已送达" },
  { id: "DN-2024-004", orderId: "SO-2024-095", customer: "未来网络", date: "2024-03-23", address: "广州市南山区未来广场A座", status: "待发货" },
  { id: "DN-2024-005", orderId: "SO-2024-098", customer: "星辰实业", date: "2024-03-24", address: "成都市天河区星辰工业园", status: "配送中" },
];

export default function DeliveryNotesExportPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const filteredNotes = mockDeliveryNotes.filter(
    (note) =>
      note.customer.includes(searchTerm) || 
      note.id.includes(searchTerm) ||
      note.orderId.includes(searchTerm)
  );

  const handleExport = () => {
    setIsExporting(true);
    // 模拟导出延迟
    setTimeout(() => {
      setIsExporting(false);
      alert("送货单数据已成功导出为 Excel 文件！");
    }, 1500);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">送货单导出</h1>
          <p className="text-sm text-muted-foreground mt-2">
            管理并导出系统中的送货单及物流数据（支持 Excel 等格式）
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
          <CardTitle>送货单列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索送货单号、订单号或客户名称..."
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
                  <TableHead>送货单编号</TableHead>
                  <TableHead>关联订单号</TableHead>
                  <TableHead>客户名称</TableHead>
                  <TableHead>送货日期</TableHead>
                  <TableHead>送货地址</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotes.length > 0 ? (
                  filteredNotes.map((note) => (
                    <TableRow key={note.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          {note.id}
                        </div>
                      </TableCell>
                      <TableCell>{note.orderId}</TableCell>
                      <TableCell>{note.customer}</TableCell>
                      <TableCell>{note.date}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={note.address}>
                        {note.address}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            note.status === "已送达"
                              ? "bg-green-100 text-green-700"
                              : note.status === "配送中"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {note.status}
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
                      没有找到匹配的送货单记录
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
