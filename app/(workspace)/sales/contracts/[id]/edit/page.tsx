"use client";

import { use, useState, useEffect } from "react";
import { SalesDocumentForm } from "@/components/sales/SalesDocumentForm";

export default function EditContractPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);

  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const res = await fetch(`/api/sales-documents/${resolvedParams.id}`);
        if (res.ok) {
          const data = await res.json();
          setDocument(data);
        }
      } catch (error) {
        console.error("Failed to fetch document:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [resolvedParams.id]);

  if (loading) {
    return <div className="p-8 text-center text-zinc-500">加載中...</div>;
  }

  if (!document) {
    return <div className="p-8 text-center text-red-500">未找到合同</div>;
  }

  return <SalesDocumentForm type="CONTRACT" initialData={document} isEdit={true} />;
}
