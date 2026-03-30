import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: 獲取會計類別列表
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json({ error: "Missing companyId" }, { status: 400 });
    }

    const categories = await prisma.accountingCategory.findMany({
      where: { companyId },
      orderBy: { code: "asc" },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Failed to fetch accounting categories:", error);
    return NextResponse.json({ error: "Failed to fetch accounting categories" }, { status: 500 });
  }
}

// POST: 創建會計類別
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId, code, name, description } = body;

    if (!companyId || !code || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if code already exists for this company
    const existingCategory = await prisma.accountingCategory.findUnique({
      where: {
        companyId_code: {
          companyId,
          code,
        },
      },
    });

    if (existingCategory) {
      return NextResponse.json({ error: "Category code already exists" }, { status: 400 });
    }

    const category = await prisma.accountingCategory.create({
      data: {
        companyId,
        code,
        name,
        description,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Failed to create accounting category:", error);
    return NextResponse.json({ error: "Failed to create accounting category" }, { status: 500 });
  }
}
