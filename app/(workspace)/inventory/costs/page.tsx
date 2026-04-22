import { redirect } from "next/navigation";

/** 成本展示已整合至「詳細庫存與成本」 */
export default function InventoryCostsRedirectPage() {
  redirect("/inventory/details");
}
