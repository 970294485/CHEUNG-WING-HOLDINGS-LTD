import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/server";
import { buildCustomerListWhere } from "@/lib/server/customers";

export async function GET(request: Request) {
  try {
    const { companyId } = await requireAuth();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const groupId = searchParams.get("groupId") || "";

    const where: Prisma.CustomerWhereInput = {
      ...buildCustomerListWhere(companyId, search),
      ...(groupId ? { groupId } : {}),
    };

    const customers = await prisma.customer.findMany({
      where,
      include: {
        group: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(customers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const { companyId } = await requireAuth();
    const body = await request.json();

    const customer = await prisma.customer.create({
      data: {
        companyId,
        name: body.name,
        code: body.code,
        contactPerson: body.contactPerson,
        email: body.email,
        phone: body.phone,
        address: body.address,
        taxId: body.taxId,
        source: body.source,
        status: body.status || "ACTIVE",
        groupId: body.groupId || null,
      },
    });

    return NextResponse.json(customer);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
