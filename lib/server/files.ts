"use server";

import { copyFile, mkdir, unlink, writeFile } from "fs/promises";
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

/** 個人網盤可選分類（與上傳／歸類一致），供公共庫「存到個人網盤」等使用。 */
export async function listPersonalDriveCategoryOptions(
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

export type PublicFileListRow = FileDocumentRow & {
  ownerName: string | null;
  inPersonalDrive: boolean;
};

async function queryPublicFileDocumentsRows(companyId: string, userId: string): Promise<PublicFileListRow[]> {
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

  const publicIds = rows.map((r) => r.id);
  /** 使用 raw SQL，避免本地 @prisma/client 未執行 generate 時 findMany 不認識 copiedFromPublicFileId */
  const linkedRows =
    publicIds.length === 0
      ? []
      : await prisma.$queryRaw<Array<{ copiedFromPublicFileId: string | null }>>(
          Prisma.sql`
            SELECT "copiedFromPublicFileId"
            FROM "FileDocument"
            WHERE "companyId" = ${companyId}
              AND "ownerId" = ${userId}
              AND "copiedFromPublicFileId" IS NOT NULL
              AND "copiedFromPublicFileId" IN (${Prisma.join(publicIds)})
          `,
        );
  const inPersonalDriveSet = new Set(
    linkedRows.map((x) => x.copiedFromPublicFileId).filter((id): id is string => id != null),
  );

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
    inPersonalDrive: inPersonalDriveSet.has(r.id),
  }));
}

export type PublicLibraryPagePayloadResult =
  | { ok: true; files: PublicFileListRow[] }
  | {
      ok: false;
      reason: "not_logged_in" | "no_permission" | "no_company";
      /** 默認公司解析失敗時的原始錯誤，便於排查 */
      detail?: string;
    };

/** 供公共庫 RSC 使用：不拋錯，區分未登入／無文件權限／公司配置問題。 */
export async function getPublicLibraryPagePayload(): Promise<PublicLibraryPagePayloadResult> {
  const session = await getSession();
  if (!session?.sub) return { ok: false, reason: "not_logged_in" };
  if (!canReadFiles(session.isSuperAdmin === true, session.permissions ?? [])) {
    return { ok: false, reason: "no_permission" };
  }
  let companyId: string;
  try {
    companyId = await getDefaultCompanyId();
  } catch (e) {
    return {
      ok: false,
      reason: "no_company",
      detail: e instanceof Error ? e.message : String(e),
    };
  }
  const files = await queryPublicFileDocumentsRows(companyId, session.sub);
  return { ok: true, files };
}

export async function listPublicFileDocuments(): Promise<PublicFileListRow[]> {
  await requireFilesRead();
  const companyId = await requireCompanyId();
  const userId = await requireSessionSub();
  return queryPublicFileDocumentsRows(companyId, userId);
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

/**
 * 將公共庫中的一條檔案複製到當前用戶的個人網盤（新記錄 + 新存儲路徑），不修改原公共檔案。
 */
export async function copyPublicFileToPersonalDrive(
  publicFileId: string,
  categoryId: string | null,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireFilesManage();
    const companyId = await requireCompanyId();
    const userId = await requireSessionSub();

    const sourceId = publicFileId.trim();
    if (!sourceId) return { ok: false, error: "無效的檔案" };

    const source = await prisma.fileDocument.findFirst({
      where: { id: sourceId, companyId, isPublic: true },
      select: { id: true, name: true, size: true, mimeType: true },
    });
    if (!source) return { ok: false, error: "找不到公共檔案或無權複製" };

    const srcPath = fileDocumentDiskPath(companyId, source.id);
    const newId = randomUUID();
    const destPath = fileDocumentDiskPath(companyId, newId);

    let nextCategoryId: string | null = null;
    let isPublic = false;
    const rawCat = categoryId?.trim() ?? "";
    if (rawCat) {
      const cat = await prisma.fileCategory.findFirst({
        where: { id: rawCat, companyId },
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

    await mkdir(path.dirname(destPath), { recursive: true });
    try {
      await copyFile(srcPath, destPath);
    } catch {
      return { ok: false, error: "來源檔案不存在或無法讀取" };
    }

    await prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO "FileDocument" (
          "id", "companyId", "categoryId", "name", "size", "url", "mimeType",
          "ownerId", "isPublic", "copiedFromPublicFileId", "createdAt", "updatedAt"
        ) VALUES (
          ${newId},
          ${companyId},
          ${nextCategoryId},
          ${source.name},
          ${source.size},
          ${`${companyId}/${newId}`},
          ${source.mimeType},
          ${userId},
          ${isPublic},
          ${source.id},
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
      `,
    );

    revalidatePath("/files/personal-drive");
    revalidatePath("/files/public-library");
    return { ok: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "複製失敗";
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
