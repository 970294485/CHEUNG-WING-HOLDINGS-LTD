import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function buildCustomerListWhere(
  companyId: string,
  search: string
): Prisma.CustomerWhereInput {
  const where: Prisma.CustomerWhereInput = { companyId };
  const q = search.trim();
  if (q) {
    // SQLite：Prisma 不支援 StringFilter.mode；使用 contains 即可
    where.OR = [
      { name: { contains: q } },
      { code: { contains: q } },
      { contactPerson: { contains: q } },
      { phone: { contains: q } },
      { email: { contains: q } },
      { address: { contains: q } },
      { source: { contains: q } },
    ];
  }
  return where;
}

export async function findCustomersForList(companyId: string, search: string) {
  return prisma.customer.findMany({
    where: buildCustomerListWhere(companyId, search),
    include: { group: true },
    orderBy: { createdAt: "desc" },
  });
}
