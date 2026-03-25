import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDefaultCompanyId } from "@/lib/company";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const companyId = await getDefaultCompanyId();
    const body = await req.json();
    const { name, description, permissionIds } = body;

    // Verify role exists and belongs to company
    const existingRole = await prisma.role.findUnique({
      where: { id: (await params).id },
    });

    if (!existingRole || existingRole.companyId !== companyId) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Update role and its permissions
    const role = await prisma.$transaction(async (tx) => {
      // First, delete existing permissions
      await tx.rolePermission.deleteMany({
        where: { roleId: (await params).id },
      });

      // Then, update role and add new permissions
      return tx.role.update({
        where: { id: (await params).id },
        data: {
          name,
          description,
          permissions: {
            create: (permissionIds || []).map((permissionId: string) => ({
              permissionId,
            })),
          },
        },
      });
    });

    return NextResponse.json(role);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update role" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const companyId = await getDefaultCompanyId();

    const existingRole = await prisma.role.findUnique({
      where: { id: (await params).id },
      include: { _count: { select: { users: true } } },
    });

    if (!existingRole || existingRole.companyId !== companyId) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    if (existingRole._count.users > 0) {
      return NextResponse.json(
        { error: "Cannot delete role because it has users assigned to it" },
        { status: 400 }
      );
    }

    await prisma.role.delete({
      where: { id: (await params).id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete role" },
      { status: 500 }
    );
  }
}
