import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { companyId, user } = await requireAuth();
    const body = await request.json();

    // Verify ownership
    const customer = await prisma.customer.findFirst({
      where: { id: (await params).id, companyId },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const followUp = await prisma.customerFollowUp.create({
      data: {
        customerId: (await params).id,
        type: body.type || "NOTE",
        content: body.content,
        createdBy: user.id,
      },
    });

    return NextResponse.json(followUp);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
