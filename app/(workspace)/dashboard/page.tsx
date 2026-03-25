import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getDefaultCompanyId } from "@/lib/company";
import { getProfitAndLoss } from "@/lib/finance/reports";
import { Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth/session";
import {
  FileText,
  Banknote,
  UploadCloud,
  Bell,
  AlertTriangle,
  Clock,
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Receipt,
  FileSpreadsheet,
  Landmark,
  CreditCard,
  CheckCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

function money(d: Prisma.Decimal | number) {
  const v = typeof d === "number" ? d : Number(d.toString());
  return v.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function DashboardPage() {
  const session = await getSession();
  const userName = session?.name || "财务专员";

  const companyId = await getDefaultCompanyId();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [company, pl, arOpen, apOpen, prepay, pendingPR, draftJe] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId } }),
    getProfitAndLoss(companyId, { start, end }),
    prisma.accountsReceivable.findMany({
      where: { companyId, status: { in: ["OPEN", "PARTIAL"] } },
    }),
    prisma.accountsPayable.findMany({
      where: { companyId, status: { in: ["OPEN", "PARTIAL"] } },
    }),
    prisma.prepayment.aggregate({
      where: { companyId, status: { not: "CLOSED" } },
      _sum: { amount: true },
    }),
    prisma.paymentRequest.count({ where: { companyId, status: "SUBMITTED" } }),
    prisma.journalEntry.count({ where: { companyId, status: "DRAFT" } }),
  ]);

  const arOutstanding = arOpen.reduce((s, r) => s + (Number(r.amount) - Number(r.receivedAmount)), 0);
  const apOutstanding = apOpen.reduce((s, r) => s + (Number(r.amount) - Number(r.paidAmount)), 0);

  const today = new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* 1. 顶部：欢迎区与快捷操作 */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">财务工作台</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            早上好，{userName}！今天是 {today}。
            <span className="ml-2 text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md">
              {company?.name ?? "—"}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <QuickActionButton href="/accounting/journals/new" icon={<FileText className="h-4 w-4" />} label="录入凭证" />
          <QuickActionButton href="/financial/prepayments" icon={<Banknote className="h-4 w-4" />} label="登记预收款" />
          <QuickActionButton href="/financial/payment-requests" icon={<CheckCircle className="h-4 w-4" />} label="请款审批" />
          <QuickActionButton href="/reports/export" icon={<FileSpreadsheet className="h-4 w-4" />} label="导出报表" />
        </div>
      </div>

      {/* 3. 数据概览：财务关键指标看板 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="本月净利"
          value={`¥${pl.netIncome}`}
          description="本月利润和损失"
          icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
          trend="up"
        />
        <StatCard
          title="应收未结 (AR)"
          value={`¥${money(arOutstanding)}`}
          description={`${arOpen.length} 笔待收款`}
          icon={<Landmark className="h-4 w-4 text-blue-500" />}
          trend="warning"
        />
        <StatCard
          title="应付未结 (AP)"
          value={`¥${money(apOutstanding)}`}
          description={`${apOpen.length} 笔待付款`}
          icon={<CreditCard className="h-4 w-4 text-orange-500" />}
          trend="neutral"
        />
        <StatCard
          title="预收款 (未关闭)"
          value={`¥${money(prepay._sum.amount ?? 0)}`}
          description="待核销的预收款项"
          icon={<Wallet className="h-4 w-4 text-zinc-500" />}
          trend="neutral"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        {/* 2. 核心关注：财务待办与提醒 (占据左侧大块) */}
        <div className="md:col-span-4 space-y-4">
          <Card>
            <div className="border-b border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2">
                <Bell className="h-5 w-5" />
                财务待办与提醒
              </h2>
              <div className="flex gap-2 text-sm">
                <button className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 font-medium text-zinc-900 dark:text-zinc-100">
                  待审批 <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">{pendingPR}</span>
                </button>
                <button className="px-3 py-1 rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  草稿凭证 <span className="ml-1 rounded-full bg-zinc-500 px-1.5 py-0.5 text-[10px] text-white">{draftJe}</span>
                </button>
              </div>
            </div>
            <div className="p-0">
              <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {pendingPR > 0 && (
                  <TodoItem 
                    title={`请款单审批：您有 ${pendingPR} 笔请款待审核`} 
                    time="刚刚" 
                    type="支出审批" 
                    urgent 
                    href="/financial/payment-requests"
                  />
                )}
                {arOpen.length > 0 && (
                  <TodoItem 
                    title={`应收账款提醒：有 ${arOpen.length} 笔应收账款待跟进`} 
                    time="今日" 
                    type="应收账款" 
                    urgent
                    href="/accounting/ar"
                  />
                )}
                {draftJe > 0 && (
                  <TodoItem 
                    title={`草稿凭证待过账：${draftJe} 笔`} 
                    time="今日" 
                    type="会计凭证" 
                    href="/accounting/journals"
                  />
                )}
                {apOpen.length > 0 && (
                  <TodoItem 
                    title={`账单支付：有 ${apOpen.length} 笔应付账款待处理`} 
                    time="今日" 
                    type="应付账款" 
                    href="/accounting/ap"
                  />
                )}
                {pendingPR === 0 && arOpen.length === 0 && draftJe === 0 && apOpen.length === 0 && (
                  <li className="p-8 text-center text-zinc-500 text-sm">
                    目前没有待办事项，太棒了！
                  </li>
                )}
              </ul>
            </div>
          </Card>
        </div>

        {/* 4. 底部：预警与报表入口 (占据右侧小块) */}
        <div className="md:col-span-3 space-y-4">
          <Card>
            <div className="border-b border-zinc-200 dark:border-zinc-800 p-4">
              <h2 className="font-semibold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                预警区
              </h2>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div className="relative pl-4 border-l-2 border-red-500">
                  <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-red-500"></div>
                  <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">预算超支预警</h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                    <span className="text-red-600 dark:text-red-400 font-medium">行政部</span> 预算已超支 10%
                  </p>
                  <Link href="/financial/budget" className="text-xs text-blue-600 hover:underline mt-1 inline-block">查看详情 &rarr;</Link>
                </div>
                
                <div className="relative pl-4 border-l-2 border-orange-500">
                  <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-orange-500"></div>
                  <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">现金流预警</h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                    现金流预计在 <span className="text-orange-600 dark:text-orange-400 font-medium">15 天后</span> 不足
                  </p>
                  <Link href="/financial/analysis-reports" className="text-xs text-blue-600 hover:underline mt-1 inline-block">查看报告 &rarr;</Link>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <h2 className="font-semibold mb-3">核心财务报表</h2>
              <div className="space-y-2">
                <Link href="/accounting/reports/pl" className="flex items-center justify-between p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-md transition-colors text-sm border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700">
                  <span className="flex items-center gap-2"><Receipt className="h-4 w-4 text-blue-500" /> 利润和损失表 (P&L)</span>
                  <ArrowRight className="h-4 w-4 text-zinc-400" />
                </Link>
                <Link href="/accounting/reports/bs" className="flex items-center justify-between p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-md transition-colors text-sm border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700">
                  <span className="flex items-center gap-2"><Landmark className="h-4 w-4 text-indigo-500" /> 企业资产负债表</span>
                  <ArrowRight className="h-4 w-4 text-zinc-400" />
                </Link>
                <Link href="/financial/budget" className="flex items-center justify-between p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-md transition-colors text-sm border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700">
                  <span className="flex items-center gap-2"><Wallet className="h-4 w-4 text-emerald-500" /> 月度预算执行报告</span>
                  <ArrowRight className="h-4 w-4 text-zinc-400" />
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// --- 辅助组件 ---

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-zinc-200 bg-white text-zinc-950 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 ${className}`}>
      {children}
    </div>
  );
}

function QuickActionButton({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-800 dark:hover:bg-zinc-800 transition-all"
    >
      {icon}
      {label}
    </Link>
  );
}

function StatCard({ title, value, description, icon, trend }: { title: string; value: string; description: string; icon: React.ReactNode; trend: "up" | "down" | "warning" | "neutral" }) {
  return (
    <Card className="p-6">
      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="tracking-tight text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</h3>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <p className={`text-xs mt-1 ${
          trend === "up" ? "text-emerald-500" : 
          trend === "down" ? "text-rose-500" : 
          trend === "warning" ? "text-orange-500" : "text-zinc-500"
        }`}>
          {description}
        </p>
      </div>
    </Card>
  );
}

function TodoItem({ title, time, type, urgent = false, href }: { title: string; time: string; type: string; urgent?: boolean; href: string }) {
  return (
    <li className="flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 rounded-full p-1 ${urgent ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30'}`}>
          {urgent ? <AlertTriangle className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
        </div>
        <div>
          <p className="text-sm font-medium leading-none mb-1">{title}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{time} · {type}</p>
        </div>
      </div>
      <Link href={href} className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
        去处理
      </Link>
    </li>
  );
}
