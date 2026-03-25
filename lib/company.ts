import { prisma } from "./prisma";

export async function getDefaultCompanyId(): Promise<string> {
  const company = await prisma.company.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (!company) {
    throw new Error("尚未初始化公司数据，请运行: npx prisma db push && npx prisma db seed");
  }
  return company.id;
}
