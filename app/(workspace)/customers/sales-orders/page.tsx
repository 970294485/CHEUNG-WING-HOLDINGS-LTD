import { prisma } from "@/lib/prisma";
import { getDefaultCompanyId } from "@/lib/company";
import { SalesOrdersClient } from "./sales-orders-client";

export default async function SalesOrdersPage() {
  const companyId = await getDefaultCompanyId();

  // Fetch sales documents
  const documents = await prisma.salesDocument.findMany({
    where: { companyId },
    include: {
      customer: true,
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: { date: "desc" },
  });

  // Fetch customers for dropdown
  const customers = await prisma.customer.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
  });

  // Fetch products for line items
  const products = await prisma.product.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
  });

  // Serialize decimals for client component
  const serializedDocuments = documents.map(doc => ({
    ...doc,
    totalAmount: Number(doc.totalAmount),
    items: doc.items.map(item => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      discount: Number(item.discount),
      taxRate: Number(item.taxRate),
      total: Number(item.total),
      product: item.product ? {
        ...item.product,
        price: Number(item.product.price),
        cost: Number(item.product.cost),
      } : item.product
    }))
  }));

  const serializedProducts = products.map(p => ({
    ...p,
    price: Number(p.price),
    cost: Number(p.cost),
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">銷售開單管理 (Sales Orders)</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          管理報價單、合同與預收發票。
        </p>
      </div>

      <SalesOrdersClient 
        documents={serializedDocuments} 
        customers={customers} 
        products={serializedProducts} 
      />
    </div>
  );
}
