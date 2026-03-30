import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/server";

export async function GET(request: Request) {
  try {
    const { companyId } = await requireAuth();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // e.g., "2026-03"

    // 佣金計算邏輯：
    // 1. 查找已完成 (COMPLETED) 的銷售合同
    // 2. 根據合同總金額計算佣金（這裡假設固定比例 5% 作為示例，實際業務中可能更復雜）
    
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

    // 模擬佣金計算結果
    const commissionRate = 0.05; // 5% 佣金率
    
    const commissions = completedContracts.map(contract => ({
      id: contract.id,
      documentNo: contract.documentNo,
      customerName: contract.customer?.name || "未知客戶",
      date: contract.date,
      totalAmount: Number(contract.totalAmount),
      commissionRate: commissionRate * 100,
      commissionAmount: Number(contract.totalAmount) * commissionRate,
      status: "待結算", // 實際業務中可能需要單獨的表來記錄佣金結算狀態
      salesperson: "系統默認銷售" // 實際業務中應關聯具體的銷售人員
    }));

    // 計算彙總數據
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
