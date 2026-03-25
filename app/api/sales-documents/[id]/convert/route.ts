import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/server";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { companyId } = await requireAuth();
    const body = await request.json();
    const { targetType } = body; // "CONTRACT" or "PROFORMA_INVOICE"

    // Get the source document
    const source = await prisma.salesDocument.findFirst({
      where: { id: params.id, companyId },
      include: { items: true },
    });

    if (!source) {
      return NextResponse.json({ error: "Source document not found" }, { status: 404 });
    }

    // Generate new Document Number
    const prefix = targetType === "CONTRACT" ? "CT-" : "PI-";
    const documentNo = `${prefix}${Date.now()}`;

    // Create the new document
    const target = await prisma.salesDocument.create({
      data: {
        companyId,
        type: targetType,
        documentNo,
        customerId: source.customerId,
        date: new Date(),
        totalAmount: source.totalAmount,
        status: "DRAFT",
        notes: `Converted from ${source.documentNo}`,
        parentId: source.id,
        items: {
          create: source.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            taxRate: item.taxRate,
            total: item.total,
          })),
        },
      },
    });

    // Update source status
    await prisma.salesDocument.update({
      where: { id: source.id },
      data: {
        status: targetType === "CONTRACT" ? "CONFIRMED" : "COMPLETED",
      },
    });

    return NextResponse.json(target);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
