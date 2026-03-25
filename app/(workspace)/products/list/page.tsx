import { prisma } from "@/lib/prisma";
import { getDefaultCompanyId } from "@/lib/company";
import { ProductListClient } from "./product-list-client";

export default async function Page() {
  const companyId = await getDefaultCompanyId();
  const products = await prisma.product.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      sku: true,
      name: true,
      barcode: true,
      description: true,
      price: true,
      cost: true,
      attributes: true,
      updatedAt: true,
    }
  });

  return <ProductListClient products={products} />;
}
