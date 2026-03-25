import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { companyId } = await requireAuth();

    const group = await prisma.customerGroup.findFirst({
      where: { id: (await params).id, companyId },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    return NextResponse.json(group);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { companyId } = await requireAuth();
    const body = await request.json();

    const group = await prisma.customerGroup.update({
      where: { id: (await params).id, companyId },
      data: {
        name: body.name,
        description: body.description,
      },
    });

    return NextResponse.json(group);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { companyId } = await requireAuth();

    await prisma.customerGroup.delete({
      where: { id: (await params).id, companyId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
