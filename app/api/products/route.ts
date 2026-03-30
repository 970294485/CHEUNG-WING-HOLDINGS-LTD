import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: 獲取產品列表
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    // #region agent log
    fetch('http://127.0.0.1:7562/ingest/25b6807d-6a78-480b-9773-0fa4b4bd4303',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d5412d'},body:JSON.stringify({sessionId:'d5412d',location:'app/api/products/route.ts:10',message:'GET products',data:{companyId},timestamp:Date.now(),runId:'run1',hypothesisId:'1'})}).catch(()=>{});
    // #endregion

    if (!companyId) {
      return NextResponse.json({ error: "Missing companyId" }, { status: 400 });
    }

    const products = await prisma.product.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(products);
  } catch (error) {
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
