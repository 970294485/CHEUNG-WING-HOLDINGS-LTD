"use server";

import * as XLSX from "xlsx";
import type { SalesDocumentType, SalesDocumentStatus, PaymentRequestStatus, PurchaseOrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getDefaultCompanyId } from "@/lib/company";
import { getSession } from "@/lib/auth/session";
import { canReadExports } from "@/lib/rbac/exports-access";
import { pickPaymentRequestExportApplicant } from "@/lib/finance/payment-request-export-applicant";
import { stripPaymentRequestSeedTitleSuffix } from "@/lib/finance/unified-accounts-payable";

export type ExportDataResult<T> =
  | { ok: true; rows: T[] }
  | { ok: false; reason: "no_company" | "no_permission" | "not_logged_in" };

async function assertExportAccess(): Promise<
  | { ok: true; companyId: string }
  | { ok: false; reason: "no_company" | "no_permission" | "not_logged_in" }
> {
  const session = await getSession();
  if (!session?.sub) return { ok: false, reason: "not_logged_in" };
  if (!canReadExports(session.isSuperAdmin === true, session.permissions ?? [])) {
    return { ok: false, reason: "no_permission" };
  }
  const companyId = await getDefaultCompanyId();
  if (!companyId) return { ok: false, reason: "no_company" };
  return { ok: true, companyId };
}

function decToNumber(d: { toString(): string }): number {
  return Number(d.toString());
}

function salesStatusLabel(s: SalesDocumentStatus): string {
  const m: Record<SalesDocumentStatus, string> = {
    DRAFT: "草稿",
    PENDING: "待定",
    CONFIRMED: "已確認",
    CANCELLED: "已取消",
    COMPLETED: "已完成",
  };
  return m[s] ?? s;
}

function prStatusLabel(s: PaymentRequestStatus): string {
  const m: Record<PaymentRequestStatus, string> = {
    DRAFT: "草稿",
    SUBMITTED: "待審批",
    APPROVED: "已通過",
    REJECTED: "已駁回",
    PAID: "已支付",
  };
  return m[s] ?? s;
}

function poStatusLabel(s: PurchaseOrderStatus): string {
  const m: Record<PurchaseOrderStatus, string> = {
    DRAFT: "草稿",
    PENDING: "待審批",
    APPROVED: "已核准",
    COMPLETED: "已完成",
    CANCELLED: "已取消",
  };
  return m[s] ?? s;
}

export type SalesExportRow = {
  id: string;
  documentNo: string;
  customerName: string;
  date: string;
  dueDate: string | null;
  amount: number;
  status: string;
};

export async function loadSalesDocumentsExportData(
  type: SalesDocumentType,
): Promise<ExportDataResult<SalesExportRow>> {
  const gate = await assertExportAccess();
  if (!gate.ok) return gate;

  const { companyId } = gate;

  const rows = await prisma.salesDocument.findMany({
    where: { companyId, type },
    include: { customer: { select: { name: true } } },
    orderBy: { date: "desc" },
    take: 2000,
  });

  return {
    ok: true,
    rows: rows.map((r) => ({
      id: r.id,
      documentNo: r.documentNo,
      customerName: r.customer.name,
      date: r.date.toISOString().slice(0, 10),
      dueDate: r.dueDate ? r.dueDate.toISOString().slice(0, 10) : null,
      amount: decToNumber(r.totalAmount),
      status: salesStatusLabel(r.status),
    })),
  };
}

export async function loadPaymentRequestsExportData(): Promise<
  ExportDataResult<{
    id: string;
    title: string;
    department: string | null;
    applicant: string;
    date: string;
    amount: number;
    status: string;
  }>
> {
  const gate = await assertExportAccess();
  if (!gate.ok) return gate;
  const { companyId } = gate;

  const rows = await prisma.paymentRequest.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    take: 2000,
  });

  return {
    ok: true,
    rows: rows.map((r) => ({
      id: r.id,
      title: stripPaymentRequestSeedTitleSuffix(r.title),
      department: r.department,
      applicant: pickPaymentRequestExportApplicant(r.id),
      date: r.createdAt.toLocaleDateString("en-CA", { timeZone: "Asia/Hong_Kong" }),
      amount: decToNumber(r.amount),
      status: prStatusLabel(r.status),
    })),
  };
}

/** 依當前列表選中的請款單 ID 導出 Excel（須具備導出權限，且 ID 須屬於當前公司）。 */
export async function exportPaymentRequestIdsExcel(ids: string[]): Promise<ExcelResult> {
  const gate = await assertExportAccess();
  if (!gate.ok) return { ok: false, error: "無權限或無公司資料" };
  if (ids.length === 0) return { ok: false, error: "沒有可導出的記錄" };
  const { companyId } = gate;
  const rows = await prisma.paymentRequest.findMany({
    where: { companyId, id: { in: ids } },
    orderBy: { createdAt: "desc" },
  });
  if (rows.length === 0) return { ok: false, error: "找不到對應的請款記錄" };
  const headers = ["ID", "標題", "部門", "費用類別", "申請人", "申請日期", "金額 (HKD)", "狀態", "備註"];
  const dataRows = rows.map((r) => [
    r.id,
    stripPaymentRequestSeedTitleSuffix(r.title),
    r.department,
    r.category,
    pickPaymentRequestExportApplicant(r.id),
    r.createdAt.toLocaleDateString("en-CA", { timeZone: "Asia/Hong_Kong" }),
    decToNumber(r.amount),
    prStatusLabel(r.status),
    r.purpose,
  ]);
  return buildExcelBase64(
    "請款導出",
    headers,
    dataRows,
    `付款請求_當前公司_${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
}

export type PurchaseExportRow = {
  id: string;
  poNumber: string;
  vendorName: string;
  date: string;
  expectedDate: string | null;
  amount: number;
  status: string;
};

export async function loadPurchaseOrdersExportData(): Promise<ExportDataResult<PurchaseExportRow>> {
  const gate = await assertExportAccess();
  if (!gate.ok) return gate;
  const { companyId } = gate;

  const rows = await prisma.purchaseOrder.findMany({
    where: { companyId },
    orderBy: { date: "desc" },
    take: 2000,
  });

  return {
    ok: true,
    rows: rows.map((r) => ({
      id: r.id,
      poNumber: r.poNumber,
      vendorName: r.vendorName,
      date: r.date.toISOString().slice(0, 10),
      expectedDate: r.expectedDate ? r.expectedDate.toISOString().slice(0, 10) : null,
      amount: decToNumber(r.totalAmount),
      status: poStatusLabel(r.status),
    })),
  };
}

type ExcelResult = { ok: true; base64: string; filename: string } | { ok: false; error: string };

async function buildExcelBase64(
  sheetName: string,
  headers: string[],
  dataRows: (string | number | null)[][],
  filename: string,
): Promise<ExcelResult> {
  try {
    const aoa = [headers, ...dataRows.map((row) => row.map((c) => (c === null ? "" : c)))];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
    return {
      ok: true,
      base64: Buffer.from(buf).toString("base64"),
      filename,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "導出失敗" };
  }
}

export async function exportSalesDocumentsExcel(type: SalesDocumentType): Promise<ExcelResult> {
  const res = await loadSalesDocumentsExportData(type);
  if (!res.ok) return { ok: false, error: "無權限或無公司資料" };

  const typeLabel =
    type === "QUOTATION" ? "報價單" : type === "CONTRACT" ? "合同" : "預收發票";
  const headers = ["單據編號", "客戶", "日期", "到期日", "總金額", "狀態"];
  const dataRows = res.rows.map((r) => [
    r.documentNo,
    r.customerName,
    r.date,
    r.dueDate,
    r.amount,
    r.status,
  ]);
  return buildExcelBase64(
    typeLabel,
    headers,
    dataRows,
    `${typeLabel}_當前公司_${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
}

export async function exportPaymentRequestsExcel(): Promise<ExcelResult> {
  const res = await loadPaymentRequestsExportData();
  if (!res.ok) return { ok: false, error: "無權限或無公司資料" };
  const headers = ["ID", "標題", "部門", "申請人", "申請日期", "金額", "狀態"];
  const dataRows = res.rows.map((r) => [
    r.id,
    r.title,
    r.department,
    r.applicant,
    r.date,
    r.amount,
    r.status,
  ]);
  return buildExcelBase64(
    "請款",
    headers,
    dataRows,
    `付款請求_當前公司_${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
}

export async function exportPurchaseOrdersExcel(): Promise<ExcelResult> {
  const res = await loadPurchaseOrdersExportData();
  if (!res.ok) return { ok: false, error: "無權限或無公司資料" };
  const headers = ["採購單號", "供應商", "日期", "預計交貨", "總金額", "狀態"];
  const dataRows = res.rows.map((r) => [
    r.poNumber,
    r.vendorName,
    r.date,
    r.expectedDate,
    r.amount,
    r.status,
  ]);
  return buildExcelBase64(
    "採購交貨",
    headers,
    dataRows,
    `採購單_當前公司_${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
}
