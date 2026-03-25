import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/server";

export async function GET(request: Request) {
  try {
    const { companyId } = await requireAuth();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // e.g., "2026-03"

    // 佣金计算逻辑：
    // 1. 查找已完成 (COMPLETED) 的销售合同
    // 2. 根据合同总金额计算佣金（这里假设固定比例 5% 作为示例，实际业务中可能更复杂）
    
    let dateFilter = {};
    if (month) {
      const startDate = new Date(`${month}-01T00:00:00.000Z`);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      
      dateFilter = {
        date: {
          gte: startDate,
          lt: endDate,
        }
      };
    }

    const completedContracts = await prisma.salesDocument.findMany({
      where: {
        companyId,
        type: "CONTRACT",
        status: "COMPLETED",
        ...dateFilter
      },
      include: {
        customer: true,
      },
      orderBy: { date: "desc" },
    });

    // 模拟佣金计算结果
    const commissionRate = 0.05; // 5% 佣金率
    
    const commissions = completedContracts.map(contract => ({
      id: contract.id,
      documentNo: contract.documentNo,
      customerName: contract.customer?.name || "未知客户",
      date: contract.date,
      totalAmount: Number(contract.totalAmount),
      commissionRate: commissionRate * 100,
      commissionAmount: Number(contract.totalAmount) * commissionRate,
      status: "待结算", // 实际业务中可能需要单独的表来记录佣金结算状态
      salesperson: "系统默认销售" // 实际业务中应关联具体的销售人员
    }));

    // 计算汇总数据
    const summary = {
      totalSales: commissions.reduce((sum, item) => sum + item.totalAmount, 0),
      totalCommission: commissions.reduce((sum, item) => sum + item.commissionAmount, 0),
      contractCount: commissions.length
    };

    return NextResponse.json({
      data: commissions,
      summary
    });
  } catch (error: any) {
    console.error("Failed to fetch commissions:", error);
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
