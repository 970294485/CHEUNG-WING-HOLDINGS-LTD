import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/server";

export async function GET(request: Request) {
  try {
    const { companyId } = await requireAuth();

    const followUps = await prisma.customerFollowUp.findMany({
      where: { 
        customer: { companyId }
      },
      include: {
        customer: {
          select: { id: true, name: true }
        }
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(followUps);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const { companyId } = await requireAuth();
    const body = await request.json();

    // Verify the customer belongs to the current company
    const customer = await prisma.customer.findFirst({
      where: { id: body.customerId, companyId }
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const followUp = await prisma.customerFollowUp.create({
      data: {
        customerId: body.customerId,
        type: body.type,
        content: body.content,
        date: body.date ? new Date(body.date) : new Date(),
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
