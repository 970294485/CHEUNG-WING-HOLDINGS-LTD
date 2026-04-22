import type { SessionUser } from "@/lib/auth/session";
import { getSession } from "@/lib/auth/session";

/**
 * 可維護本公司用戶、角色、權限目錄：超級管理員，或具 manage:all / manage:data_entry 的公司角色。
 */
export function canManageOrganizationDirectoryFlags(
  isSuperAdmin: boolean | undefined,
  permissions: string[]
): boolean {
  if (isSuperAdmin === true) return true;
  return permissions.includes("manage:all") || permissions.includes("manage:data_entry");
}

export function canManageOrganizationDirectory(session: SessionUser | null): boolean {
  if (!session?.sub) return false;
  return canManageOrganizationDirectoryFlags(session.isSuperAdmin === true, session.permissions ?? []);
}

export async function assertOrganizationDirectoryAdmin(): Promise<SessionUser> {
  const s = await getSession();
  if (!s?.sub) throw new Error("請先登入");
  if (!canManageOrganizationDirectory(s)) {
    throw new Error("無權限：需為超級管理員或具「資料輸入」管理權（manage:data_entry / manage:all）");
  }
  return s;
}
