/**
 * 與側欄「系統設定 (Settings)」對齊：無 data_entry 權限則不可進入這些路徑。
 * 超級管理員與具 manage:all 的公司角色不受此限。
 */
export const SYSTEM_SETTINGS_PATH_PREFIXES = [
  "/data-entry/company-profile",
  "/data-entry/document-numbers",
  "/data-entry/company-permissions",
  "/accounting/accounts",
  "/financial/approval-permissions",
] as const;

export function pathRequiresSystemSettingsPermission(pathname: string): boolean {
  return SYSTEM_SETTINGS_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function canAccessSystemSettingsRoutes(
  isSuperAdmin: boolean,
  permissions: string[]
): boolean {
  if (isSuperAdmin) return true;
  if (permissions.includes("manage:all")) return true;
  return permissions.includes("read:data_entry") || permissions.includes("manage:data_entry");
}

/** 可修改「資料輸入／系統設定」類資料（與 server action CUD 對齊）：超管、manage:all、manage:data_entry */
export function canManageDataEntrySettings(
  isSuperAdmin: boolean,
  permissions: string[]
): boolean {
  if (isSuperAdmin) return true;
  if (permissions.includes("manage:all")) return true;
  return permissions.includes("manage:data_entry");
}
