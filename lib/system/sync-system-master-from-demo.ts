import type { PrismaClient } from "@prisma/client";
import { syncNutCatalog } from "@/app/(workspace)/products/list/nut-catalog";
import {
  ensurePermissionCatalog,
  seedDefaultRolesForCompany,
} from "@/lib/rbac/seed-company-rbac";

export type SyncSystemMasterSummary = {
  demoFound: boolean;
  targets: { code: string; chartCopied: boolean; rulesCopied: boolean; nutSynced: boolean }[];
};

/**
 * 將 DEMO 公司的「系統主數據」模板同步到其他公司（冪等、不覆寫已有總帳科目）。
 * - 全域：補齊 Permission 目錄。
 * - 每家公司：補齊預設「公司角色」等（seedDefaultRolesForCompany）。
 * - 若目標公司尚無總帳科目：從 DEMO 複製會計類別 + 科目（含 parent 順序）。
 * - 若目標公司尚無任何單號規則：從 DEMO 複製 DocumentNumberRule。
 * - 每家公司執行 syncNutCatalog（堅果主數據 SKU，與 seed 一致）。
 */
export async function syncSystemMasterFromDemo(
  db: PrismaClient,
  options?: { targetCompanyCode?: string },
): Promise<SyncSystemMasterSummary> {
  const summary: SyncSystemMasterSummary = { demoFound: false, targets: [] };

  const demo = await db.company.findFirst({
    where: { code: "DEMO" },
    select: { id: true, code: true },
  });
  if (!demo) return summary;
  summary.demoFound = true;

  await ensurePermissionCatalog(db);

  const codeFilter = options?.targetCompanyCode?.trim();
  const list = await db.company.findMany({
    where: codeFilter ? { code: codeFilter } : undefined,
    select: { id: true, code: true, name: true },
    orderBy: { code: "asc" },
  });

  if (codeFilter && list.length === 0) {
    return summary;
  }

  for (const company of list) {
    await seedDefaultRolesForCompany(db, company.id);

    const glCount = await db.glAccount.count({ where: { companyId: company.id } });
    const chartCopied = company.id !== demo.id && glCount === 0;

    if (chartCopied) {
      const demoCats = await db.accountingCategory.findMany({
        where: { companyId: demo.id },
        orderBy: { code: "asc" },
      });
      for (const c of demoCats) {
        await db.accountingCategory.upsert({
          where: { companyId_code: { companyId: company.id, code: c.code } },
          create: {
            companyId: company.id,
            code: c.code,
            name: c.name,
            description: c.description,
          },
          update: { name: c.name, description: c.description },
        });
      }

      const demoGl = await db.glAccount.findMany({
        where: { companyId: demo.id },
        orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
      });
      const roots = demoGl.filter((a) => !a.parentId);
      const childs = demoGl.filter((a) => a.parentId);
      const ordered = [...roots, ...childs];
      const idMap = new Map<string, string>();

      for (const a of ordered) {
        let parentNew: string | null = null;
        if (a.parentId) {
          parentNew = idMap.get(a.parentId) ?? null;
        }
        const row = await db.glAccount.upsert({
          where: { companyId_code: { companyId: company.id, code: a.code } },
          create: {
            companyId: company.id,
            code: a.code,
            name: a.name,
            type: a.type,
            parentId: parentNew,
            isActive: a.isActive,
            sortOrder: a.sortOrder,
          },
          update: {
            name: a.name,
            type: a.type,
            parentId: parentNew,
            isActive: a.isActive,
            sortOrder: a.sortOrder,
          },
        });
        idMap.set(a.id, row.id);
      }
    }

    const ruleCount = await db.documentNumberRule.count({
      where: { companyId: company.id },
    });
    const rulesCopied = company.id !== demo.id && ruleCount === 0;
    if (rulesCopied) {
      const demoRules = await db.documentNumberRule.findMany({
        where: { companyId: demo.id },
      });
      for (const r of demoRules) {
        await db.documentNumberRule.upsert({
          where: {
            companyId_documentType: {
              companyId: company.id,
              documentType: r.documentType,
            },
          },
          create: {
            companyId: company.id,
            documentType: r.documentType,
            prefix: r.prefix,
            dateFormat: r.dateFormat,
            sequenceLen: r.sequenceLen,
            currentSeq: r.currentSeq,
          },
          update: {
            prefix: r.prefix,
            dateFormat: r.dateFormat,
            sequenceLen: r.sequenceLen,
          },
        });
      }
    }

    await syncNutCatalog(db, company.id);

    summary.targets.push({
      code: company.code,
      chartCopied,
      rulesCopied,
      nutSynced: true,
    });
  }

  return summary;
}

