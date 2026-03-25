import { prisma } from "@/lib/prisma";
import { getDefaultCompanyId } from "@/lib/company";
import { TypesAttributesClient } from "./types-attributes-client";

export default async function Page() {
  const companyId = await getDefaultCompanyId();
  const products = await prisma.product.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      sku: true,
      name: true,
      attributes: true,
    }
  });

  return <TypesAttributesClient products={products} />;
}
