import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { companyId } = await requireAuth();
    const body = await request.json();

    // Verify ownership
    const existing = await prisma.customerFollowUp.findFirst({
      where: {
        id: (await params).id,
        customer: { companyId }
      }
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const followUp = await prisma.customerFollowUp.update({
      where: { id: (await params).id },
      data: {
        type: body.type,
        content: body.content,
        date: body.date ? new Date(body.date) : undefined,
      },
      include: {
        customer: {
          select: { id: true, name: true }
        }
      }
    });

    return NextResponse.json(followUp);
  } catch (error: any) {
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
    const existing = await prisma.customerFollowUp.findFirst({
      where: {
        id: (await params).id,
        customer: { companyId }
      }
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.customerFollowUp.delete({
      where: { id: (await params).id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
