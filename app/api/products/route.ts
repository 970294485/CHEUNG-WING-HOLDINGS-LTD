import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/server";

// GET: 當前登入租戶的產品列表（與產品列表頁 /api/customers 一致，依 session + 活躍公司）
export async function GET() {
  try {
    const { companyId } = await requireAuth();

    const products = await prisma.product.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(products);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch products";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("Failed to fetch products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

// POST: 創建產品
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId, sku, barcode, name, description, price, cost, attributes } = body;

    if (!companyId || !sku || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if SKU already exists for this company
    const existingProduct = await prisma.product.findUnique({
      where: {
        companyId_sku: {
          companyId,
          sku,
        },
      },
    });

    if (existingProduct) {
      return NextResponse.json({ error: "SKU already exists" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        companyId,
        sku,
        barcode,
        name,
        description,
        price: price ? parseFloat(price) : 0,
        cost: cost ? parseFloat(cost) : 0,
        attributes: attributes || {},
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Failed to create product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
