import { prisma } from "@/lib/prisma";
import { getDefaultCompanyId } from "@/lib/company";
import { BasicInfoClient } from "./basic-info-client";

export default async function Page(props: {
  searchParams: Promise<{ id?: string }>;
}) {
  const searchParams = await props.searchParams;
  const companyId = await getDefaultCompanyId();
  const id = searchParams?.id;

  let product = null;
  if (id) {
    product = await prisma.product.findUnique({
      where: { id, companyId },
    });
  }

  return <BasicInfoClient initialProduct={product} />;
}
