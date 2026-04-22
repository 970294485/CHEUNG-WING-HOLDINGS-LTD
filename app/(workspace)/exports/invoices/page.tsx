import { prisma } from "@/lib/prisma";
import { getDefaultCompanyId } from "@/lib/company";
import { InvoiceExportClient, type InvoiceExportRow } from "./invoice-export-client";

export const dynamic = "force-dynamic";

function hkCalendarDate(d: Date) {
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Hong_Kong" });
}

export default async function InvoiceExportPage() {
  const companyId = await getDefaultCompanyId();
  const rows = await prisma.salesDocument.findMany({
    where: { companyId, type: "PROFORMA_INVOICE" },
    include: { customer: { select: { name: true } } },
    orderBy: [{ date: "desc" }, { documentNo: "desc" }],
  });

  const initialInvoices: InvoiceExportRow[] = rows.map((r) => ({
    id: r.id,
    documentNo: r.documentNo,
    customerName: r.customer.name,
    date: hkCalendarDate(r.date),
    amount: r.totalAmount.toString(),
    status: r.status,
  }));

  return <InvoiceExportClient initialInvoices={initialInvoices} />;
}
