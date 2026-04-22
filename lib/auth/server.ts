import { getSession } from "./session";
import { getDefaultCompanyId } from "@/lib/company";

export async function requireAuth() {
  const session = await getSession();
  if (!session?.sub) {
    throw new Error("Unauthorized");
  }
  
  const companyId = await getDefaultCompanyId();
  
  return {
    user: session,
    companyId,
  };
}
