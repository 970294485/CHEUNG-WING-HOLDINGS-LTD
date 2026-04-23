import { prisma } from "@/lib/prisma";
import { getDefaultCompanyId } from "@/lib/company";
import { ProductListClient } from "./product-list-client";
import { NUT_CATALOG } from "./nut-catalog";

const nutCatalogRowBySku = new Map(NUT_CATALOG.map((r) => [r.sku, r] as const));

export default async function Page() {
  const companyId = await getDefaultCompanyId();
  const raw = await prisma.product.findMany({
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
    },
  });

  /**
   * 堅果目錄 SKU：列表展示與 nut-catalog 一致（無需重跑 seed），含已清空的 BOM。
   */
  const products = raw.map((p) => {
    const row = nutCatalogRowBySku.get(p.sku);
    if (!row) return p;
    return {
      ...p,
      description: row.description,
      attributes: row.attributes,
    };
  });

  return <ProductListClient products={products} />;
}
