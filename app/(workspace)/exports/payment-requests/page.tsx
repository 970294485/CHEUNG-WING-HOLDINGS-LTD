import { prisma } from "@/lib/prisma";
import { getDefaultCompanyId } from "@/lib/company";
import { pickPaymentRequestExportApplicant } from "@/lib/finance/payment-request-export-applicant";
import { stripPaymentRequestSeedTitleSuffix } from "@/lib/finance/unified-accounts-payable";
import {
  PaymentRequestExportClient,
  type PaymentRequestExportRow,
} from "./payment-request-export-client";

export const dynamic = "force-dynamic";

function hkCalendarDate(d: Date) {
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Hong_Kong" });
}

export default async function PaymentRequestsExportPage() {
  const companyId = await getDefaultCompanyId();
  if (!companyId) {
    return <PaymentRequestExportClient initialRows={[]} />;
  }

  const rows = await prisma.paymentRequest.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    take: 2000,
  });

  const initialRows: PaymentRequestExportRow[] = rows.map((r) => ({
    id: r.id,
    title: stripPaymentRequestSeedTitleSuffix(r.title),
    category: r.category,
    department: r.department,
    applicant: pickPaymentRequestExportApplicant(r.id),
    date: hkCalendarDate(r.createdAt),
    amount: r.amount.toString(),
    status: r.status,
  }));

  return <PaymentRequestExportClient initialRows={initialRows} />;
}
