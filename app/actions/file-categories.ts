"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getDefaultCompanyId } from "@/lib/company";

// 獲取所有文件分類（當前工作公司）
export async function getFileCategories() {
  try {
    const companyId = await getDefaultCompanyId();
    const categories = await prisma.fileCategory.findMany({
      where: { companyId, ownerId: null },
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

// 創建文件分類（當前工作公司）
export async function createFileCategory(data: {
  name: string;
  description?: string;
  parentId?: string;
  isPublic?: boolean;
}) {
  try {
    const companyId = await getDefaultCompanyId();
    if (data.parentId) {
      const parent = await prisma.fileCategory.findFirst({
        where: { id: data.parentId, companyId },
        select: { ownerId: true },
      });
      if (!parent) {
        return { success: false, message: "父分類不存在" };
      }
      if (parent.ownerId != null) {
        return { success: false, message: "不可將公司分類掛在個人分類下" };
      }
    }
    const category = await prisma.fileCategory.create({
      data: {
        companyId,
        name: data.name,
        description: data.description,
        parentId: data.parentId || null,
        isPublic: data.isPublic ?? false,
        ownerId: null,
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
    const companyId = await getDefaultCompanyId();
    const existing = await prisma.fileCategory.findFirst({
      where: { id, companyId },
    });
    if (!existing) {
      return { success: false, message: "分類不存在或無權限" };
    }
    if (existing.ownerId != null) {
      return { success: false, message: "個人網盤分類請在個人網盤中管理" };
    }
    if (data.parentId) {
      const parent = await prisma.fileCategory.findFirst({
        where: { id: data.parentId, companyId },
        select: { ownerId: true },
      });
      if (!parent) {
        return { success: false, message: "父分類不存在" };
      }
      if (parent.ownerId != null) {
        return { success: false, message: "不可將公司分類掛在個人分類下" };
      }
    }
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
    const companyId = await getDefaultCompanyId();
    const existing = await prisma.fileCategory.findFirst({
      where: { id, companyId },
    });
    if (!existing) {
      return { success: false, message: "分類不存在或無權限" };
    }
    if (existing.ownerId != null) {
      return { success: false, message: "個人網盤分類請在個人網盤中管理" };
    }
    await prisma.fileCategory.delete({
      where: { id },
    });
    revalidatePath("/files/categories");
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
