/** 與 JWT 權限對齊：導出中心 */

export function canReadExports(isSuperAdmin: boolean, permissions: string[]): boolean {
  if (isSuperAdmin) return true;
  if (permissions.includes("manage:all")) return true;
  return permissions.includes("read:exports") || permissions.includes("manage:exports");
}
