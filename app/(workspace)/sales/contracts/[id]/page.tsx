"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileDown, ArrowRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ContractDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const res = await fetch(`/api/sales-documents/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setDocument(data);
        }
      } catch (error) {
        console.error("获取合同失败:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [params.id]);

  const handleConvert = async () => {
    try {
      const res = await fetch(`/api/sales-documents/${params.id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType: "PROFORMA_INVOICE" }),
      });
      if (res.ok) {
        alert("已成功生成预收发票！");
        router.push("/sales/proforma-invoices");
      } else {
        const err = await res.json();
        alert(`生成失败: ${err.error}`);
      }
    } catch (error) {
      alert("生成失败");
    }
  };

  const handleExportPDF = async () => {
    try {
      const { exportDocumentToPDF } = await import("@/lib/utils/pdf-export");
      exportDocumentToPDF(document, "Contract");
    } catch (error) {
      console.error("导出 PDF 失败:", error);
      alert("导出失败");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-zinc-500">加载中...</div>;
  }

  if (!document) {
    return <div className="p-8 text-center text-red-500">未找到合同</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">合同详情</h1>
            <p className="text-sm text-zinc-500 mt-1">{document.documentNo}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {document.status !== "COMPLETED" && (
            <Button
              variant="outline"
              onClick={handleConvert}
              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 border-purple-200"
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              转预收发票
            </Button>
          )}
          <Button variant="outline" onClick={handleExportPDF}>
            <FileDown className="mr-2 h-4 w-4" />
            导出 PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-sm text-zinc-500">单号</div>
              <div className="col-span-2 font-medium">{document.documentNo}</div>
              
              <div className="text-sm text-zinc-500">客户</div>
              <div className="col-span-2">{document.customer?.name || "-"}</div>
              
              <div className="text-sm text-zinc-500">日期</div>
              <div className="col-span-2">{new Date(document.date).toLocaleDateString()}</div>
              
              <div className="text-sm text-zinc-500">有效期限</div>
              <div className="col-span-2">{document.dueDate ? new Date(document.dueDate).toLocaleDateString() : "-"}</div>
              
              <div className="text-sm text-zinc-500">状态</div>
              <div className="col-span-2">
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                  {document.status}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>备注信息</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{document.notes || "无备注"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>产品明细</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>产品名称</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">数量</TableHead>
                <TableHead className="text-right">单价</TableHead>
                <TableHead className="text-right">折扣(%)</TableHead>
                <TableHead className="text-right">税率(%)</TableHead>
                <TableHead className="text-right">小计</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {document.items?.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.product?.name || "未知产品"}</TableCell>
                  <TableCell>{item.product?.sku || "-"}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">¥{Number(item.unitPrice).toLocaleString()}</TableCell>
                  <TableCell className="text-right">{Number(item.discount)}%</TableCell>
                  <TableCell className="text-right">{Number(item.taxRate)}%</TableCell>
                  <TableCell className="text-right font-medium">¥{Number(item.total).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="flex justify-end pt-6 mt-6 border-t">
            <div className="text-right">
              <p className="text-sm text-zinc-500 mb-1">总计金额</p>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white">
                ¥{Number(document.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
