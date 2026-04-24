/**
 * 僅寫入「案件分類與管理」演示數據（不跑完整 prisma/seed.ts）。
 * 需已存在 code=DEMO 公司。用法：npm run db:seed:document-cases
 */
import { PrismaClient } from "@prisma/client";
import { seedDocumentCases } from "../prisma/seed-document-cases";

const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.findUnique({ where: { code: "DEMO" } });
  if (!company) {
    throw new Error("找不到 DEMO 公司，請先執行 npm run db:seed 或建立公司資料。");
  }
  await seedDocumentCases(prisma, company.id);
  console.log("案件分類與管理種子寫入完成：", company.code);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
