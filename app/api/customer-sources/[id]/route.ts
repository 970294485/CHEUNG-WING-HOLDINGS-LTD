import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { companyId } = await requireAuth();

    const source = await prisma.customerSource.findFirst({
      where: {
        id: (await params).id,
        companyId,
      },
    });

    if (!source) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    return NextResponse.json(source);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { companyId } = await requireAuth();
    const body = await request.json();

    // Verify ownership
    const existing = await prisma.customerSource.findFirst({
      where: { id: (await params).id, companyId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    // If name changed, optionally update all customers with the old source name
    // This is a nice-to-have feature for data consistency
    if (existing.name !== body.name) {
      await prisma.$transaction([
        prisma.customerSource.update({
          where: { id: (await params).id },
          data: {
            name: body.name,
            description: body.description,
          },
        }),
        prisma.customer.updateMany({
          where: { companyId, source: existing.name },
          data: { source: body.name },
        }),
      ]);
      
      return NextResponse.json({ success: true });
    }

    const source = await prisma.customerSource.update({
      where: { id: (await params).id },
      data: {
        name: body.name,
        description: body.description,
      },
    });

    return NextResponse.json(source);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "該來源名稱已存在" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { companyId } = await requireAuth();

    // Verify ownership
    const existing = await prisma.customerSource.findFirst({
      where: { id: (await params).id, companyId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    await prisma.customerSource.delete({
      where: { id: (await params).id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
