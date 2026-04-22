import type { PrismaClient } from "@prisma/client";

/**
 * 與 TVP 業務模組對齊的全域權限（Permission 不帶 companyId）。
 * JWT 內為字串陣列，格式 action:resource，供 middleware / 日後細粒度授權使用。
 */
export const PERMISSION_SEEDS: { action: string; resource: string; description: string }[] = [
  { action: "manage", resource: "all", description: "所有模組（系統管理）" },
  { action: "read", resource: "all", description: "全系統唯讀瀏覽" },
  { action: "read", resource: "dashboard", description: "儀表板與營運摘要" },
  { action: "read", resource: "accounting", description: "查看會計、總帳、憑證、試算、資產負債表、損益、應收應付" },
  { action: "manage", resource: "accounting", description: "維護會計科目、憑證、結帳與應收應付作業" },
  { action: "read", resource: "sales", description: "查看報價、合同、形式發票、銷售分析等" },
  { action: "manage", resource: "sales", description: "建立與修改銷售單據與相關流程" },
  { action: "read", resource: "customers", description: "查看客戶檔案、跟進、分組、郵件推廣等" },
  { action: "manage", resource: "customers", description: "維護客戶主檔、跟進與分組" },
  { action: "read", resource: "products", description: "查看產品列表、基礎資料、類型屬性與價格" },
  { action: "manage", resource: "products", description: "維護產品主檔與價格" },
  { action: "read", resource: "inventory", description: "查看庫存、出入庫、採購單與庫存對接" },
  { action: "manage", resource: "inventory", description: "維護庫存異動、倉儲與採購單" },
  { action: "read", resource: "financial", description: "查看預收、請款、預算、財務分析與審批設定" },
  { action: "manage", resource: "financial", description: "維護預收、請款、預算與財務相關批核" },
  { action: "read", resource: "data_entry", description: "查看公司資料、用戶、角色、單號規則等設定" },
  { action: "manage", resource: "data_entry", description: "維護公司主檔、用戶、角色權限與單號規則" },
  { action: "read", resource: "exports", description: "查看並下載報價/合同/發票等導出" },
  { action: "manage", resource: "exports", description: "產生與管理導出文件" },
  { action: "read", resource: "files", description: "查看企業文件庫與網盤" },
  { action: "manage", resource: "files", description: "上傳與管理文件" },
];

/** 全功能公司角色（含系統設定選單對應之 data_entry）。 */
export const COMPANY_ROLE_NAME = "公司角色";

/** 不含「系統設定」相關 data_entry 權限，其餘業務模組與全功能公司角色一致。 */
export const COMPANY_ROLE_BUSINESS_NAME = "公司角色（業務）";

export function isBuiltinCompanyRoleName(name: string): boolean {
  return name === COMPANY_ROLE_NAME || name === COMPANY_ROLE_BUSINESS_NAME;
}

/** 除 data_entry 與「全系統」通配外，權限目錄中的其餘鍵（供公司角色（業務）使用）。 */
export function getCompanyBusinessRolePermissionKeys(): string[] {
  return PERMISSION_SEEDS.filter(
    (p) =>
      p.resource !== "data_entry" &&
      !(p.action === "manage" && p.resource === "all") &&
      !(p.action === "read" && p.resource === "all")
  ).map((p) => `${p.action}:${p.resource}`);
}

type RoleTemplate = { name: string; description: string; permissionKeys: string[] };

/**
 * 預設公司內角色：全功能「公司角色」+ 不含系統設定的「公司角色（業務）」。
 * 平台超級管理員由 User.isSuperAdmin 標記，不在此表。
 */
const DEFAULT_ROLE_TEMPLATES: RoleTemplate[] = [
  {
    name: COMPANY_ROLE_NAME,
    description: "公司內全功能（含系統設定選單；不含平台超管專屬頁）。",
    permissionKeys: ["manage:all"],
  },
  {
    name: COMPANY_ROLE_BUSINESS_NAME,
    description: "公司內業務使用：除「系統設定」相關頁面外，其餘模組可用。",
    permissionKeys: getCompanyBusinessRolePermissionKeys(),
  },
];

export async function ensurePermissionCatalog(prisma: PrismaClient): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const p of PERMISSION_SEEDS) {
    const row = await prisma.permission.upsert({
      where: { action_resource: { action: p.action, resource: p.resource } },
      create: { action: p.action, resource: p.resource, description: p.description },
      update: { description: p.description },
    });
    map.set(`${p.action}:${p.resource}`, row.id);
  }
  return map;
}

/** 為指定公司建立／更新預設公司角色及其權限（幂等，可重複執行）。 */
export async function seedDefaultRolesForCompany(prisma: PrismaClient, companyId: string): Promise<void> {
  const permMap = await ensurePermissionCatalog(prisma);

  for (const tmpl of DEFAULT_ROLE_TEMPLATES) {
    const role = await prisma.role.upsert({
      where: { companyId_name: { companyId, name: tmpl.name } },
      create: { companyId, name: tmpl.name, description: tmpl.description },
      update: { description: tmpl.description },
    });

    const permissionIds = tmpl.permissionKeys
      .map((k) => permMap.get(k))
      .filter((id): id is string => Boolean(id));

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    if (permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId: role.id, permissionId })),
        skipDuplicates: true,
      });
    }
  }
}
