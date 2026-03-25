"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getDefaultCompanyId } from "@/lib/company";

export async function createSalesDocument(data: any) {
  const companyId = await getDefaultCompanyId();
  
  // Generate documentNo if not provided
  let documentNo = data.documentNo;
  if (!documentNo) {
    const prefix = data.type === "QUOTATION" ? "QT-" : data.type === "CONTRACT" ? "CT-" : "PI-";
    const count = await prisma.salesDocument.count({ where: { companyId, type: data.type } });
    documentNo = `${prefix}${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`;
  }

  // Calculate total amount
  const totalAmount = data.items.reduce((sum: number, item: any) => {
    const itemTotal = item.quantity * item.unitPrice;
    const discountAmount = itemTotal * (item.discount || 0) / 100;
    const afterDiscount = itemTotal - discountAmount;
    const taxAmount = afterDiscount * (item.taxRate || 0) / 100;
    return sum + afterDiscount + taxAmount;
  }, 0);

  await prisma.salesDocument.create({
    data: {
      companyId,
      type: data.type,
      documentNo,
      customerId: data.customerId,
      date: new Date(data.date || new Date()),
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      totalAmount,
      status: data.status || "DRAFT",
      notes: data.notes,
      items: {
        create: data.items.map((item: any) => {
          const itemTotal = item.quantity * item.unitPrice;
          const discountAmount = itemTotal * (item.discount || 0) / 100;
          const afterDiscount = itemTotal - discountAmount;
          const taxAmount = afterDiscount * (item.taxRate || 0) / 100;
          
          return {
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount || 0,
            taxRate: item.taxRate || 0,
            total: afterDiscount + taxAmount,
          };
        })
      }
    }
  });

  revalidatePath("/customers/sales-orders");
}

export async function updateSalesDocumentStatus(id: string, status: any) {
  const companyId = await getDefaultCompanyId();
  await prisma.salesDocument.update({
    where: { id, companyId },
    data: { status }
  });
  revalidatePath("/customers/sales-orders");
}

export async function deleteSalesDocument(id: string) {
  const companyId = await getDefaultCompanyId();
  await prisma.salesDocument.delete({
    where: { id, companyId }
  });
  revalidatePath("/customers/sales-orders");
}
