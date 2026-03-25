import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDefaultCompanyId } from "@/lib/company";

export async function POST(req: Request) {
  try {
    const companyId = await getDefaultCompanyId();
    const body = await req.json();
    const { name, description, permissionIds } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const existingRole = await prisma.role.findUnique({
      where: { companyId_name: { companyId, name } },
    });

    if (existingRole) {
      return NextResponse.json({ error: "Role with this name already exists" }, { status: 400 });
    }

    const role = await prisma.role.create({
      data: {
        companyId,
        name,
        description,
        permissions: {
          create: (permissionIds || []).map((permissionId: string) => ({
            permissionId,
          })),
        },
      },
    });

    return NextResponse.json(role);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create role" },
      { status: 500 }
    );
  }
}
