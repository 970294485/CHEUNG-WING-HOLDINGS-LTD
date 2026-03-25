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
      console.error("获取佣金数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, [month]);

  const handleSettle = (id: string) => {
    // 实际业务中这里会调用 API 更新佣金结算状态，并可能生成财务请款单
    alert("已提交财务结算申请！(演示功能)");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">财务与佣金整合</h1>
          <p className="text-sm text-zinc-500 mt-1">基于已完成的销售合同，自动计算销售佣金并对接财务结算。</p>
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
            <CardTitle className="text-sm font-medium">本月销售总额 (已完成)</CardTitle>
            <DollarSign className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{summary.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-zinc-500 mt-1">
              基于 {summary.contractCount} 份已完成合同
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">预计佣金总额</CardTitle>
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
            <CardTitle className="text-sm font-medium">待结算合同数</CardTitle>
            <FileText className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.contractCount}</div>
            <p className="text-xs text-zinc-500 mt-1">
              需财务审核后发放
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>佣金明细台账</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>合同单号</TableHead>
                <TableHead>客户名称</TableHead>
                <TableHead>销售人员</TableHead>
                <TableHead>完成日期</TableHead>
                <TableHead className="text-right">合同金额</TableHead>
                <TableHead className="text-right">佣金率</TableHead>
                <TableHead className="text-right">应发佣金</TableHead>
                <TableHead className="text-center">状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-zinc-500">加载中...</TableCell>
                </TableRow>
              ) : commissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-zinc-500">
                    该月暂无已完成的销售合同记录
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
                        申请结算
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
