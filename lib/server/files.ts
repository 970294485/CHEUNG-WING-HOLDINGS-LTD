"use server";

import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getDefaultCompanyId, requireCompanyId } from "@/lib/company";
import { getSession } from "@/lib/auth/session";
import { canManageFiles, canReadFiles } from "@/lib/rbac/files-access";
import { fileDocumentDiskPath } from "@/lib/files/storage";

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

async function requireSessionSub(): Promise<string> {
  const session = await getSession();
  if (!session?.sub) throw new Error("請先登入");
  return session.sub;
}

async function requireFilesRead(): Promise<void> {
  const session = await getSession();
  if (!session?.sub) throw new Error("請先登入");
  if (!canReadFiles(session.isSuperAdmin === true, session.permissions ?? [])) {
    throw new Error("無權限查看文件");
  }
}

async function requireFilesManage(): Promise<void> {
  const session = await getSession();
  if (!session?.sub) throw new Error("請先登入");
  if (!canManageFiles(session.isSuperAdmin === true, session.permissions ?? [])) {
    throw new Error("無權限上傳或刪除文件");
  }
}

function sanitizeOriginalName(name: string): string {
  const base = path.basename(name.trim() || "upload").replace(/[\x00-\x1f]/g, "");
  return base.slice(0, 200) || "upload";
}

export type FileDocumentRow = {
  id: string;
  name: string;
  size: number;
  mimeType: string | null;
  isPublic: boolean;
  createdAt: string;
  ownerId: string | null;
  categoryId: string | null;
  categoryName: string | null;
};

export type PersonalDriveCategoryOption = {
  id: string;
  name: string;
  isPublic: boolean;
};

export type PersonalDriveLoadResult =
  | { ok: true; files: FileDocumentRow[]; canManage: boolean; categories: PersonalDriveCategoryOption[] }
  | { ok: false; reason: "no_company" | "no_permission" | "not_logged_in" };

/** 供個人網盤單頁（全 client）載入資料，不拋錯。 */
export async function getPersonalDrivePagePayload(): Promise<PersonalDriveLoadResult> {
  const session = await getSession();
  if (!session?.sub) return { ok: false, reason: "not_logged_in" };
  const companyId = await getDefaultCompanyId();
  if (!companyId) return { ok: false, reason: "no_company" };
  if (!canReadFiles(session.isSuperAdmin === true, session.permissions ?? [])) {
    return { ok: false, reason: "no_permission" };
  }
  const [files, categories] = await Promise.all([
    listPersonalFileDocuments(),
    listPersonalDriveCategoryOptions(companyId, session.sub),
  ]);
  const canManage = canManageFiles(session.isSuperAdmin === true, session.permissions ?? []);
  return { ok: true, files, canManage, categories };
}

const PERSONAL_DRIVE_ROOT_PREFIX = "__pd_root__";

async function listPersonalDriveCategoryOptions(
  companyId: string,
  userId: string,
): Promise<PersonalDriveCategoryOption[]> {
  const rows = await prisma.fileCategory.findMany({
    where: {
      companyId,
      NOT: { name: { startsWith: PERSONAL_DRIVE_ROOT_PREFIX } },
      OR: [{ ownerId: null }, { ownerId: userId }],
    },
    select: { id: true, name: true, isPublic: true },
    orderBy: { name: "asc" },
  });
  return rows;
}

/** 每人一個隱藏根分類，子分類即「個人網盤文件夾」，滿足 @@unique([companyId, parentId, name]) */
async function ensurePersonalDriveRootCategory(companyId: string, userId: string): Promise<string> {
  const marker = `${PERSONAL_DRIVE_ROOT_PREFIX}${userId}`;
  const existing = await prisma.fileCategory.findFirst({
    where: { companyId, name: marker },
    select: { id: true },
  });
  if (existing) return existing.id;
  const row = await prisma.fileCategory.create({
    data: {
      companyId,
      name: marker,
      parentId: null,
      isPublic: false,
      ownerId: userId,
      description: "個人網盤根（系統內部，不在分類列表顯示）",
    },
  });
  return row.id;
}

/** 在個人網盤下新建資料夾（寫入 FileCategory，掛於該用戶隱藏根下） */
export async function createPersonalDriveFolder(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireFilesManage();
    const companyId = await requireCompanyId();
    const userId = await requireSessionSub();
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return { ok: false, error: "請輸入文件夾名稱" };

    const rootId = await ensurePersonalDriveRootCategory(companyId, userId);
    await prisma.fileCategory.create({
      data: {
        companyId,
        name,
        parentId: rootId,
        isPublic: false,
        ownerId: userId,
        description: "個人網盤資料夾",
      },
    });
    revalidatePath("/files/personal-drive");
    return { ok: true };
  } catch (e: unknown) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "已有同名文件夾，請換一個名稱" };
    }
    const msg = e instanceof Error ? e.message : "建立失敗";
    return { ok: false, error: msg };
  }
}

export async function listPersonalFileDocuments(): Promise<FileDocumentRow[]> {
  await requireFilesRead();
  const companyId = await requireCompanyId();
  const userId = await requireSessionSub();

  const rows = await prisma.fileDocument.findMany({
    where: { companyId, ownerId: userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      size: true,
      mimeType: true,
      isPublic: true,
      createdAt: true,
      ownerId: true,
      categoryId: true,
      category: { select: { name: true } },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    size: r.size,
    mimeType: r.mimeType,
    isPublic: r.isPublic,
    createdAt: r.createdAt.toISOString(),
    ownerId: r.ownerId,
    categoryId: r.categoryId,
    categoryName: r.category?.name ?? null,
  }));
}

export async function listPublicFileDocuments(): Promise<
  (FileDocumentRow & { ownerName: string | null })[]
> {
  await requireFilesRead();
  const companyId = await requireCompanyId();

  const rows = await prisma.fileDocument.findMany({
    where: { companyId, isPublic: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      size: true,
      mimeType: true,
      isPublic: true,
      createdAt: true,
      ownerId: true,
      categoryId: true,
      category: { select: { name: true } },
    },
  });

  const ownerIds = [...new Set(rows.map((r) => r.ownerId).filter(Boolean))] as string[];
  const owners =
    ownerIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: ownerIds } },
          select: { id: true, name: true, email: true },
        })
      : [];
  const ownerMap = new Map(owners.map((u) => [u.id, u.name?.trim() || u.email]));

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    size: r.size,
    mimeType: r.mimeType,
    isPublic: r.isPublic,
    createdAt: r.createdAt.toISOString(),
    ownerId: r.ownerId,
    categoryId: r.categoryId,
    categoryName: r.category?.name ?? null,
    ownerName: r.ownerId ? ownerMap.get(r.ownerId) ?? null : null,
  }));
}

export async function uploadPersonalFileDocument(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireFilesManage();
    const companyId = await requireCompanyId();
    const userId = await requireSessionSub();

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: "請選擇檔案" };
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return { ok: false, error: `檔案不可超過 ${MAX_UPLOAD_BYTES / 1024 / 1024} MB` };
    }

    const name = sanitizeOriginalName(file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    const id = randomUUID();
    const diskPath = fileDocumentDiskPath(companyId, id);
    await mkdir(path.dirname(diskPath), { recursive: true });
    await writeFile(diskPath, buffer);

    const rawCategoryId = String(formData.get("categoryId") ?? "").trim();
    let categoryId: string | null = null;
    let isPublic = false;
    if (rawCategoryId) {
      const cat = await prisma.fileCategory.findFirst({
        where: { id: rawCategoryId, companyId },
        select: { id: true, isPublic: true },
      });
      if (!cat) {
        return { ok: false, error: "所選分類不存在" };
      }
      categoryId = cat.id;
      isPublic = cat.isPublic;
    }

    await prisma.fileDocument.create({
      data: {
        id,
        companyId,
        categoryId,
        name,
        size: buffer.length,
        url: `${companyId}/${id}`,
        mimeType: file.type || null,
        ownerId: userId,
        isPublic,
      },
    });

    revalidatePath("/files/personal-drive");
    revalidatePath("/files/public-library");
    return { ok: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "上傳失敗";
    return { ok: false, error: msg };
  }
}

/** 依分類調整可見性：公共分類 → 進公共庫；私人分類或未分類 → 僅本人（與既有下載權限一致）。 */
export async function updatePersonalFileDocumentCategory(
  fileId: string,
  categoryId: string | null,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireFilesManage();
    const companyId = await requireCompanyId();
    const userId = await requireSessionSub();
    const id = fileId.trim();
    if (!id) return { ok: false, error: "無效的檔案" };

    const doc = await prisma.fileDocument.findFirst({
      where: { id, companyId, ownerId: userId },
      select: { id: true },
    });
    if (!doc) return { ok: false, error: "找不到檔案或無權修改" };

    let nextCategoryId: string | null = null;
    let isPublic = false;
    if (categoryId && categoryId.trim()) {
      const cat = await prisma.fileCategory.findFirst({
        where: { id: categoryId.trim(), companyId },
        select: { id: true, isPublic: true, ownerId: true, name: true },
      });
      if (!cat) return { ok: false, error: "所選分類不存在" };
      if (cat.name.startsWith(PERSONAL_DRIVE_ROOT_PREFIX)) {
        return { ok: false, error: "所選分類不可用" };
      }
      if (cat.ownerId != null && cat.ownerId !== userId) {
        return { ok: false, error: "僅可選擇公司分類或自己的個人文件夾" };
      }
      nextCategoryId = cat.id;
      isPublic = cat.isPublic;
    }

    await prisma.fileDocument.update({
      where: { id },
      data: { categoryId: nextCategoryId, isPublic },
    });

    revalidatePath("/files/personal-drive");
    revalidatePath("/files/public-library");
    return { ok: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "更新失敗";
    return { ok: false, error: msg };
  }
}

export async function deleteFileDocument(formData: FormData): Promise<void> {
  await requireFilesManage();
  const companyId = await requireCompanyId();
  const userId = await requireSessionSub();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const doc = await prisma.fileDocument.findFirst({
    where: { id, companyId },
  });
  if (!doc) return;
  if (doc.ownerId !== userId) {
    throw new Error("僅能上傳者刪除自己的檔案");
  }

  await prisma.fileDocument.deleteMany({ where: { id, companyId } });
  try {
    await unlink(fileDocumentDiskPath(companyId, id));
  } catch {
    /* 檔案可能已不存在 */
  }
  revalidatePath("/files/personal-drive");
  revalidatePath("/files/public-library");
}
