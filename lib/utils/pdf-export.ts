import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportDocumentToPDF(document: any, typeLabel: string) {
  const doc = new jsPDF();

  // Add Company Header
  doc.setFontSize(20);
  doc.text("Cheung Wing Holdings Limited", 14, 22);
  
  doc.setFontSize(12);
  doc.text(`${typeLabel}`, 14, 32);
  
  // Document Info
  doc.setFontSize(10);
  doc.text(`Document No: ${document.documentNo}`, 14, 45);
  doc.text(`Date: ${new Date(document.date).toLocaleDateString()}`, 14, 52);
  if (document.dueDate) {
    doc.text(`Due Date: ${new Date(document.dueDate).toLocaleDateString()}`, 14, 59);
  }

  // Customer Info
  doc.text(`Customer: ${document.customer?.name || "N/A"}`, 120, 45);
  doc.text(`Contact: ${document.customer?.contactPerson || "N/A"}`, 120, 52);
  doc.text(`Phone: ${document.customer?.phone || "N/A"}`, 120, 59);

  // Table Data
  const tableColumn = ["Product", "Quantity", "Unit Price", "Discount", "Total"];
  const tableRows: any[] = [];

  document.items?.forEach((item: any) => {
    const rowData = [
      item.product?.name || item.productId,
      item.quantity,
      `$${item.unitPrice}`,
      `$${item.discount}`,
      `$${item.total}`,
    ];
    tableRows.push(rowData);
  });

  // @ts-ignore
  autoTable(doc, {
    startY: 70,
    head: [tableColumn],
    body: tableRows,
    theme: "striped",
    headStyles: { fillColor: [39, 39, 42] }, // zinc-900
  });

  // Total Amount
  // @ts-ignore
  const finalY = doc.lastAutoTable.finalY || 70;
  doc.setFontSize(12);
  doc.text(`Total Amount: $${document.totalAmount}`, 140, finalY + 15);

  // Notes
  if (document.notes) {
    doc.setFontSize(10);
    doc.text("Notes:", 14, finalY + 15);
    doc.text(document.notes, 14, finalY + 22);
  }

  // Save the PDF
  doc.save(`${document.documentNo}.pdf`);
}
