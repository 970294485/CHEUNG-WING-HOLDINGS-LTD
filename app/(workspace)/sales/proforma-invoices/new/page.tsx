import { SalesDocumentForm } from "@/components/sales/SalesDocumentForm";

export default function NewProformaInvoicePage() {
  return <SalesDocumentForm type="PROFORMA_INVOICE" isEdit={false} />;
}
