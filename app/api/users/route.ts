import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDefaultCompanyId } from "@/lib/company";

export async function POST(req: Request) {
  try {
    const companyId = await getDefaultCompanyId();
    const body = await req.json();
    const { name, email, password, roleIds } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // In a real app, hash the password
    const passwordHash = password; // TODO: use bcrypt or similar

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        roles: {
          create: (roleIds || []).map((roleId: string) => ({
            roleId,
            companyId,
          })),
        },
      },
    });

    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create user" },
      { status: 500 }
    );
  }
}
