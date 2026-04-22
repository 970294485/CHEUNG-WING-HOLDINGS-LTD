import { getDefaultCompanyId } from "@/lib/company";
import { PurchaseOrdersClient } from "./purchase-orders-client";

export default async function PurchaseOrdersPage() {
  const companyId = await getDefaultCompanyId();
  return <PurchaseOrdersClient companyId={companyId} />;
}
