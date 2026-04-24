/** 付款請求導出專用：依請款單 id 穩定分配申請人顯示名（四選一）。 */
const EXPORT_APPLICANT_POOL = [
  "TAI CHUK NI戴祝妮",
  "WONG OI CHUN黃爱真",
  "WONG OI YEE 黃愛義",
  "WONG YUEN YING黃婉英",
] as const;

export function pickPaymentRequestExportApplicant(paymentRequestId: string): string {
  let h = 0;
  for (let i = 0; i < paymentRequestId.length; i++) {
    h = (h * 31 + paymentRequestId.charCodeAt(i)) >>> 0;
  }
  return EXPORT_APPLICANT_POOL[h % EXPORT_APPLICANT_POOL.length];
}
