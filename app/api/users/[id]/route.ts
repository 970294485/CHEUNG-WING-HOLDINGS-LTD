import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { resolveTargetCompanyForUserRoles } from "@/lib/users/resolve-role-assignment";
import { canManageOrganizationDirectory } from "@/lib/rbac/organization-admin";
import { getDefaultCompanyId } from "@/lib/company";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !canManageOrganizationDirectory(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await ctx.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        isSuperAdmin: true,
        createdAt: true,
        roles: {
          include: {
            role: { select: { id: true, name: true } },
            company: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });
    if (!user) {
      return NextResponse.json({ error: "用戶不存在" }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load user";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !canManageOrganizationDirectory(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let defaultCompanyId: string;
    try {
      defaultCompanyId = await getDefaultCompanyId();
    } catch {
      return NextResponse.json({ error: "尚未建立公司" }, { status: 422 });
    }

    const { id } = await ctx.params;
    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, isSuperAdmin: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "用戶不存在" }, { status: 404 });
    }

    if (!session.isSuperAdmin && existing.isSuperAdmin) {
      return NextResponse.json({ error: "無權編輯超級管理員帳號" }, { status: 403 });
    }

    const body = (await req.json()) as {
      name?: string | null;
      email?: string;
      password?: string;
      isSuperAdmin?: boolean;
      companyId?: string;
      roleIds?: string[];
    };

    const name =
      body.name !== undefined ? (typeof body.name === "string" ? body.name.trim() || null : body.name) : undefined;
    const email = typeof body.email === "string" ? body.email.trim() : undefined;
    const password = typeof body.password === "string" ? body.password : undefined;
    const { isSuperAdmin, companyId: bodyCompanyId, roleIds } = body;

    if (typeof isSuperAdmin === "boolean" && !session.isSuperAdmin) {
      return NextResponse.json({ error: "無權修改超級管理員標記" }, { status: 403 });
    }

    if (typeof isSuperAdmin === "boolean") {
      if (id === session.sub && isSuperAdmin === false) {
        const otherSuper = await prisma.user.count({
          where: { isSuperAdmin: true, NOT: { id: session.sub } },
        });
        if (otherSuper === 0) {
          return NextResponse.json(
            { error: "不可取消最後一個超級管理員的權限" },
            { status: 400 }
          );
        }
      }
    }

    if (email !== undefined) {
      if (!email) {
        return NextResponse.json({ error: "郵箱不可為空" }, { status: 400 });
      }
      const taken = await prisma.user.findFirst({
        where: { email, NOT: { id } },
        select: { id: true },
      });
      if (taken) {
        return NextResponse.json({ error: "該郵箱已被其他用戶使用" }, { status: 400 });
      }
    }

    const data: {
      name?: string | null;
      email?: string;
      passwordHash?: string;
      isSuperAdmin?: boolean;
    } = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (password !== undefined && password.length > 0) {
      data.passwordHash = bcrypt.hashSync(password, 10);
    }
    if (typeof isSuperAdmin === "boolean" && session.isSuperAdmin) {
      data.isSuperAdmin = isSuperAdmin;
    }

    const patchRoles = roleIds !== undefined;
    const companyTrim =
      typeof bodyCompanyId === "string" && bodyCompanyId.trim() ? bodyCompanyId.trim() : null;

    if (patchRoles && !companyTrim) {
      return NextResponse.json(
        { error: "更新角色時必須指定 companyId（要修改的所屬公司）" },
        { status: 400 }
      );
    }

    if (companyTrim && companyTrim !== defaultCompanyId) {
      return NextResponse.json({ error: "僅可更新本公司角色" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      if (Object.keys(data).length > 0) {
        await tx.user.update({ where: { id }, data });
      }

      if (patchRoles) {
        const ids = Array.isArray(roleIds) ? roleIds.filter((x): x is string => Boolean(x)) : [];
        if (ids.length > 0) {
          const resolved = await resolveTargetCompanyForUserRoles({
            roleIds: ids,
            bodyCompanyId: defaultCompanyId,
            fallbackCompanyId: defaultCompanyId,
          });
          if (!resolved.ok) {
            throw Object.assign(new Error(resolved.error), { status: resolved.status });
          }
          const targetCompanyId = resolved.targetCompanyId;
          if (targetCompanyId !== defaultCompanyId) {
            throw Object.assign(new Error("角色不屬於本公司"), { status: 400 });
          }
          await tx.userRole.deleteMany({
            where: { userId: id, companyId: targetCompanyId },
          });
          await tx.userRole.createMany({
            data: ids.map((roleId) => ({
              userId: id,
              roleId,
              companyId: targetCompanyId,
            })),
          });
        } else {
          await tx.userRole.deleteMany({
            where: { userId: id, companyId: companyTrim! },
          });
        }
      }
    });

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        isSuperAdmin: true,
        createdAt: true,
        roles: {
          include: {
            role: { select: { id: true, name: true } },
            company: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });
    return NextResponse.json(user);
  } catch (e: unknown) {
    const status = e && typeof e === "object" && "status" in e ? Number((e as { status: number }).status) : 500;
    const msg = e instanceof Error ? e.message : "Failed to update user";
    if (status !== 500) {
      return NextResponse.json({ error: msg }, { status });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !canManageOrganizationDirectory(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await ctx.params;

    if (id === session.sub) {
      return NextResponse.json({ error: "不可刪除當前登入帳號" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({
      where: { id },
      select: { isSuperAdmin: true },
    });
    if (!target) {
      return NextResponse.json({ error: "用戶不存在" }, { status: 404 });
    }
    if (!session.isSuperAdmin && target.isSuperAdmin) {
      return NextResponse.json({ error: "無權刪除超級管理員帳號" }, { status: 403 });
    }
    if (target.isSuperAdmin) {
      const superCount = await prisma.user.count({ where: { isSuperAdmin: true } });
      if (superCount <= 1) {
        return NextResponse.json({ error: "不可刪除最後一個超級管理員" }, { status: 400 });
      }
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to delete user";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
