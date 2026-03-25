import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { getAuthSecretKey } from "./secret";

export type SessionUser = {
  sub: string;
  email: string;
  name?: string | null;
  permissions?: string[];
};

export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get("tvp_session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getAuthSecretKey());
    return {
      sub: String(payload.sub ?? ""),
      email: String(payload.email ?? ""),
      name: payload.name != null ? String(payload.name) : null,
      permissions: Array.isArray(payload.permissions) ? payload.permissions : [],
    };
  } catch {
    return null;
  }
}
