import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/server";

export async function GET(request: Request) {
  try {
    const { companyId } = await requireAuth();

    const sources = await prisma.customerSource.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
    });

    // Get customer counts for each source
    // Since Customer.source is a string, we match by name
    const sourcesWithCount = await Promise.all(
      sources.map(async (source) => {
        const count = await prisma.customer.count({
          where: {
            companyId,
            source: source.name,
          },
        });
        return {
          ...source,
          _count: {
            customers: count,
          },
        };
      })
    );

    return NextResponse.json(sourcesWithCount);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const { companyId } = await requireAuth();
    const body = await request.json();

    const source = await prisma.customerSource.create({
      data: {
        companyId,
        name: body.name,
        description: body.description,
      },
    });

    return NextResponse.json(source);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "该来源名称已存在" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
