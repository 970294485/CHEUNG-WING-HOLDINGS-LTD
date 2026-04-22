/** 與 JWT 權限字串對齊：文件庫 / 網盤 */

export function canReadFiles(isSuperAdmin: boolean, permissions: string[]): boolean {
  if (isSuperAdmin) return true;
  if (permissions.includes("manage:all")) return true;
  return permissions.includes("read:files") || permissions.includes("manage:files");
}

export function canManageFiles(isSuperAdmin: boolean, permissions: string[]): boolean {
  if (isSuperAdmin) return true;
  if (permissions.includes("manage:all")) return true;
  return permissions.includes("manage:files");
}
