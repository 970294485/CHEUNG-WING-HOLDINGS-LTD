import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { companyId } = await requireAuth();
    
    const customer = await prisma.customer.findFirst({
      where: {
        id: (await params).id,
        companyId,
      },
      include: {
        group: true,
        followUps: {
          orderBy: { date: "desc" },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { companyId } = await requireAuth();
    const body = await request.json();

    // Verify ownership
    const existing = await prisma.customer.findFirst({
      where: { id: (await params).id, companyId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const data: Prisma.CustomerUpdateInput = {
      name: body.name,
      code: body.code,
      contactPerson: body.contactPerson,
      email: body.email,
      phone: body.phone,
      address: body.address,
      taxId: body.taxId,
      source: body.source,
      status: body.status,
      group: body.groupId
        ? { connect: { id: String(body.groupId) } }
        : { disconnect: true },
    };

    const customer = await prisma.customer.update({
      where: { id: (await params).id },
      data,
    });

    return NextResponse.json(customer);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { companyId } = await requireAuth();
    const { id } = await params;

    const existing = await prisma.customer.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return NextResponse.json({ error: "找不到客戶或無權限" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.salesDocument.updateMany({
        where: { customerId: id, companyId },
        data: { parentId: null },
      });
      await tx.salesDocument.deleteMany({
        where: { customerId: id, companyId },
      });
      await tx.customer.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "刪除失敗";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
