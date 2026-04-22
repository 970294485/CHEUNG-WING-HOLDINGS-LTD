import { prisma } from "./prisma";

/**
 * 全系統固定使用 code=DEMO 的公司（與種子演示一致）。
 * 若庫中尚無 DEMO 且僅有一家公司，則退回該家以便全新庫可啟動。
 */
export async function getDefaultCompanyId(): Promise<string> {
  const demo = await prisma.company.findFirst({
    where: { code: "DEMO" },
    select: { id: true },
  });
  if (demo) return demo.id;

  const total = await prisma.company.count();
  if (total === 0) {
    throw new Error("尚未初始化公司數據，請運行: npx prisma db push && npx prisma db seed");
  }
  if (total === 1) {
    const only = await prisma.company.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (!only) {
      throw new Error("尚未初始化公司數據，請運行: npx prisma db push && npx prisma db seed");
    }
    return only.id;
  }

  throw new Error(
    "系統已固定使用代碼為 DEMO 的公司；資料庫中未找到該公司且存在多家公司。請執行 npx prisma db seed，或將演示主檔公司代碼設為 DEMO。"
  );
}

/** 與 getDefaultCompanyId 相同；供 server action 語意化使用 */
export async function requireCompanyId(): Promise<string> {
  return getDefaultCompanyId();
}

/** 是否可存取該公司租戶資料（超管或已分配該公司角色） */
export async function canAccessCompanyTenantData(
  userId: string,
  companyId: string,
  isSuperAdmin: boolean
): Promise<boolean> {
  if (isSuperAdmin) return true;
  const link = await prisma.userRole.findFirst({
    where: { userId, companyId },
    select: { userId: true },
  });
  return Boolean(link);
}
