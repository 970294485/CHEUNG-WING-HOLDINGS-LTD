import { prisma } from "@/lib/prisma";
import { getDefaultCompanyId } from "@/lib/company";
import { ExportClient } from "./export-client";

export default async function Page() {
  const companyId = await getDefaultCompanyId();
  const products = await prisma.product.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
  });

  return <ExportClient products={products} />;
}
