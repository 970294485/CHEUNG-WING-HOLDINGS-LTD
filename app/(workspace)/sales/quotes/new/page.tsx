import { SalesDocumentForm } from "@/components/sales/SalesDocumentForm";

export default function NewQuotePage() {
  return <SalesDocumentForm type="QUOTATION" isEdit={false} />;
}
