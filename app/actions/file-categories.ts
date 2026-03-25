"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 獲取所有文件分類
export async function getFileCategories(companyId: string) {
  try {
    const categories = await prisma.fileCategory.findMany({
      where: { companyId },
      include: {
        parent: true,
        _count: {
          select: { files: true, children: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: categories };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// 創建文件分類
export async function createFileCategory(data: {
  companyId: string;
  name: string;
  description?: string;
  parentId?: string;
  isPublic?: boolean;
}) {
  try {
    const category = await prisma.fileCategory.create({
      data: {
        companyId: data.companyId,
        name: data.name,
        description: data.description,
        parentId: data.parentId || null,
        isPublic: data.isPublic ?? false,
      },
    });
    revalidatePath("/files/categories");
    return { success: true, data: category };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// 更新文件分類
export async function updateFileCategory(
  id: string,
  data: {
    name?: string;
    description?: string;
    parentId?: string;
    isPublic?: boolean;
  }
) {
  try {
    const category = await prisma.fileCategory.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        parentId: data.parentId || null,
        isPublic: data.isPublic,
      },
    });
    revalidatePath("/files/categories");
    return { success: true, data: category };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// 刪除文件分類
export async function deleteFileCategory(id: string) {
  try {
    await prisma.fileCategory.delete({
      where: { id },
    });
    revalidatePath("/files/categories");
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
