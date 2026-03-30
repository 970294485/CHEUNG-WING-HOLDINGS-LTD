import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT: 更新產品
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { sku, barcode, name, description, price, cost, attributes } = body;

    const product = await prisma.product.update({
      where: { id },
      data: {
        sku,
        barcode,
        name,
        description,
        price: price !== undefined ? parseFloat(price) : undefined,
        cost: cost !== undefined ? parseFloat(cost) : undefined,
        attributes: attributes || undefined,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Failed to update product:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

// DELETE: 刪除產品
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete product:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
