import { prisma } from "@/lib/prisma";
import { getDefaultCompanyId } from "@/lib/company";
import { PricingClient } from "./pricing-client";

export default async function Page() {
  const companyId = await getDefaultCompanyId();
  const products = await prisma.product.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      sku: true,
      name: true,
      price: true,
      cost: true,
      attributes: true,
    }
  });

  return <PricingClient products={products} />;
}
