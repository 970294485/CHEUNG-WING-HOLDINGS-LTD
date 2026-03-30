import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: 獲取會計科目列表
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json({ error: "Missing companyId" }, { status: 400 });
    }

    const glAccounts = await prisma.glAccount.findMany({
      where: { companyId },
      orderBy: [
        { type: "asc" },
        { code: "asc" }
      ],
    });

    return NextResponse.json(glAccounts);
  } catch (error) {
    console.error("Failed to fetch GL accounts:", error);
    return NextResponse.json({ error: "Failed to fetch GL accounts" }, { status: 500 });
  }
}

// POST: 創建會計科目
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId, code, name, type, parentId, isActive, sortOrder } = body;

    if (!companyId || !code || !name || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if code already exists for this company
    const existingAccount = await prisma.glAccount.findUnique({
      where: {
        companyId_code: {
          companyId,
          code,
        },
      },
    });

    if (existingAccount) {
      return NextResponse.json({ error: "Account code already exists" }, { status: 400 });
    }

    const glAccount = await prisma.glAccount.create({
      data: {
        companyId,
        code,
        name,
        type,
        parentId: parentId || null,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder || 0,
      },
    });

    return NextResponse.json(glAccount);
  } catch (error) {
    console.error("Failed to create GL account:", error);
    return NextResponse.json({ error: "Failed to create GL account" }, { status: 500 });
  }
}
