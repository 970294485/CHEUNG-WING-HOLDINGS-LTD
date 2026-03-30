import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT: 更新會計類別
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { code, name, description } = body;

    const category = await prisma.accountingCategory.update({
      where: { id },
      data: {
        code,
        name,
        description,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Failed to update accounting category:", error);
    return NextResponse.json({ error: "Failed to update accounting category" }, { status: 500 });
  }
}

// DELETE: 刪除會計類別
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Check if category is used in any journal lines
    const usedInJournals = await prisma.journalLine.findFirst({
      where: { accountingCategoryId: id }
    });

    if (usedInJournals) {
      return NextResponse.json({ error: "Cannot delete category that has journal entries" }, { status: 400 });
    }

    await prisma.accountingCategory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete accounting category:", error);
    return NextResponse.json({ error: "Failed to delete accounting category" }, { status: 500 });
  }
}
