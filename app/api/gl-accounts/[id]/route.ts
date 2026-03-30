import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT: 更新會計科目
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { code, name, type, parentId, isActive, sortOrder } = body;

    const glAccount = await prisma.glAccount.update({
      where: { id },
      data: {
        code,
        name,
        type,
        parentId: parentId || null,
        isActive,
        sortOrder,
      },
    });

    return NextResponse.json(glAccount);
  } catch (error) {
    console.error("Failed to update GL account:", error);
    return NextResponse.json({ error: "Failed to update GL account" }, { status: 500 });
  }
}

// DELETE: 刪除會計科目
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Check if account is used in any journal lines
    const usedInJournals = await prisma.journalLine.findFirst({
      where: { glAccountId: id }
    });

    if (usedInJournals) {
      return NextResponse.json({ error: "Cannot delete account that has journal entries" }, { status: 400 });
    }

    // Check if account has children
    const hasChildren = await prisma.glAccount.findFirst({
      where: { parentId: id }
    });

    if (hasChildren) {
      return NextResponse.json({ error: "Cannot delete account that has sub-accounts" }, { status: 400 });
    }

    await prisma.glAccount.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete GL account:", error);
    return NextResponse.json({ error: "Failed to delete GL account" }, { status: 500 });
  }
}
