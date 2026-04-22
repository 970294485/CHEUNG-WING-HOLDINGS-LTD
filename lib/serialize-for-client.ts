/**
 * 將 Prisma Decimal 等轉為可傳給 React Client Component 的純 number（Next 不允許 RSC 邊界傳 Decimal 實例）。
 */
export function toPlainNumber(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  if (typeof value === "object" && value !== null && "toString" in value) {
    const n = Number((value as { toString: () => string }).toString());
    return Number.isFinite(n) ? n : 0;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Product 列：price / cost 轉 number，其餘欄位原樣淺拷貝。 */
export function serializeProductForClient<T extends { price?: unknown; cost?: unknown }>(row: T) {
  return {
    ...row,
    price: toPlainNumber(row.price),
    cost: toPlainNumber(row.cost),
  };
}
