import { getSession } from "./session";
import { getDefaultCompanyId } from "@/lib/company";

export async function requireAuth() {
  const session = await getSession();
  if (!session?.sub) {
    throw new Error("Unauthorized");
  }
  
  // For now, we return the default company ID as we haven't implemented multi-tenant UI selection yet
  const companyId = await getDefaultCompanyId();
  
  return {
    user: session,
    companyId,
  };
}
