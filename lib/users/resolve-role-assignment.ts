import { prisma } from "@/lib/prisma";
import { isBuiltinCompanyRoleName } from "@/lib/rbac/seed-company-rbac";

export type ResolveRoleAssignmentResult =
  | { ok: true; targetCompanyId: string }
  | { ok: false; error: string; status: number };

/**
 * 與建立用戶 API 一致：依所選角色解析應寫入的 companyId（內建公司角色須明確 companyId 且與角色所屬公司一致）。
 */
export async function resolveTargetCompanyForUserRoles(params: {
  roleIds: string[];
  bodyCompanyId: string | null;
  fallbackCompanyId: string | null;
}): Promise<ResolveRoleAssignmentResult> {
  const { roleIds, bodyCompanyId, fallbackCompanyId } = params;
  const ids = roleIds.filter(Boolean);
  const bodyCompanyTrim =
    typeof bodyCompanyId === "string" && bodyCompanyId.trim() ? bodyCompanyId.trim() : null;

  if (ids.length > 0) {
    const rows = await prisma.role.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, companyId: true },
    });
    if (rows.length !== ids.length) {
      return { ok: false, error: "部分角色不存在", status: 400 };
    }
    const companyIds = new Set(rows.map((r) => r.companyId));
    if (companyIds.size !== 1) {
      return { ok: false, error: "所選角色必須屬於同一家公司", status: 400 };
    }
    const roleCompanyId = rows[0]!.companyId;
    const needsExplicitCompany = rows.some((r) => isBuiltinCompanyRoleName(r.name));
    if (needsExplicitCompany) {
      if (!bodyCompanyTrim) {
        return {
          ok: false,
          error: "分配「公司角色」或「公司角色（業務）」時必須在請求中指定 companyId（所屬公司）",
          status: 400,
        };
      }
      if (bodyCompanyTrim !== roleCompanyId) {
        return { ok: false, error: "所選公司與角色所屬公司不一致", status: 400 };
      }
      return { ok: true, targetCompanyId: roleCompanyId };
    }
    if (bodyCompanyTrim && bodyCompanyTrim !== roleCompanyId) {
      return { ok: false, error: "所選公司與角色所屬公司不一致", status: 400 };
    }
    return { ok: true, targetCompanyId: bodyCompanyTrim ?? roleCompanyId };
  }

  const targetCompanyId = bodyCompanyTrim ?? fallbackCompanyId;
  if (!targetCompanyId) {
    return { ok: false, error: "尚未建立公司或無法解析當前公司", status: 400 };
  }
  return { ok: true, targetCompanyId };
}
