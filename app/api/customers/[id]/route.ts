import { NextResponse } from "next/server";
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

    const customer = await prisma.customer.update({
      where: { id: (await params).id },
      data: {
        name: body.name,
        code: body.code,
        contactPerson: body.contactPerson,
        email: body.email,
        phone: body.phone,
        address: body.address,
        taxId: body.taxId,
        source: body.source,
        status: body.status,
        groupId: body.groupId || null,
      },
    });

    return NextResponse.json(customer);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { companyId } = await requireAuth();

    // Verify ownership
    const existing = await prisma.customer.findFirst({
      where: { id: (await params).id, companyId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    await prisma.customer.delete({
      where: { id: (await params).id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
