"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calculator, DollarSign, FileText, Search } from "lucide-react";

export default function FinanceCommissionPage() {
  const [loading, setLoading] = useState(true);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [summary, setSummary] = useState({ totalSales: 0, totalCommission: 0, contractCount: 0 });
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const fetchCommissions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/commissions?month=${month}`);
      if (res.ok) {
        const data = await res.json();
        setCommissions(data.data);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error("獲取佣金數據失敗:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, [month]);

  const handleSettle = (id: string) => {
    // 實際業務中這裡會調用 API 更新佣金結算狀態，並可能生成財務請款單
    alert("已提交財務結算申請！(演示功能)");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">財務與佣金整合</h1>
          <p className="text-sm text-zinc-500 mt-1">基於已完成的銷售合同，自動計算銷售佣金並對接財務結算。</p>
        </div>
        <div className="flex items-center gap-2">
          <Input 
            type="month" 
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-40"
          />
          <Button variant="outline" size="icon" onClick={fetchCommissions}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本月銷售總額 (已完成)</CardTitle>
            <DollarSign className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{summary.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-zinc-500 mt-1">
              基於 {summary.contractCount} 份已完成合同
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">預計佣金總額</CardTitle>
            <Calculator className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">¥{summary.totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-zinc-500 mt-1">
              平均佣金率 5.0%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待結算合同數</CardTitle>
            <FileText className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.contractCount}</div>
            <p className="text-xs text-zinc-500 mt-1">
              需財務審核後發放
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>佣金明細臺賬</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>合同單號</TableHead>
                <TableHead>客戶名稱</TableHead>
                <TableHead>銷售人員</TableHead>
                <TableHead>完成日期</TableHead>
                <TableHead className="text-right">合同金額</TableHead>
                <TableHead className="text-right">佣金率</TableHead>
                <TableHead className="text-right">應發佣金</TableHead>
                <TableHead className="text-center">狀態</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-zinc-500">加載中...</TableCell>
                </TableRow>
              ) : commissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-zinc-500">
                    該月暫無已完成的銷售合同記錄
                  </TableCell>
                </TableRow>
              ) : (
                commissions.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.documentNo}</TableCell>
                    <TableCell>{item.customerName}</TableCell>
                    <TableCell>{item.salesperson}</TableCell>
                    <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">¥{item.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right">{item.commissionRate}%</TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      ¥{item.commissionAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        {item.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleSettle(item.id)}>
                        申請結算
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
