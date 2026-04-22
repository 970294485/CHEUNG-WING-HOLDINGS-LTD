import { prisma } from "@/lib/prisma";

/** 庫存流水 referenceType 顯示文案 */
export function formatInventoryReferenceType(ref: string | null | undefined): string {
  const r = (ref ?? "").trim();
  switch (r) {
    case "PO_RECEIVE":
      return "採購收貨";
    case "SO_SHIP":
      return "銷售出庫";
    case "INITIAL":
      return "期初";
    case "MANUAL":
      return "手動";
    default:
      return r || "—";
  }
}

export function formatWarehouseLabel(warehouseId: string | null | undefined): string {
  const w = warehouseId ?? "";
  return w === "" || w == null ? "主倉" : w;
}

/**
 * 按產品彙總「入庫」流水中有單價的加權平均單位成本（用於結存估值展示）。
 */
export async function getProductInboundWeightedUnitCost(
  companyId: string
): Promise<Map<string, { unitCost: number; totalInQty: number }>> {
  const rows = await prisma.inventoryTransaction.findMany({
    where: {
      companyId,
      type: "IN",
      unitCost: { not: null },
    },
    select: { productId: true, quantity: true, unitCost: true },
  });

  const agg = new Map<string, { qty: number; val: number }>();
  for (const r of rows) {
    if (r.unitCost == null) continue;
    const u = Number(r.unitCost);
    if (!Number.isFinite(u)) continue;
    const cur = agg.get(r.productId) ?? { qty: 0, val: 0 };
    cur.qty += r.quantity;
    cur.val += r.quantity * u;
    agg.set(r.productId, cur);
  }

  const out = new Map<string, { unitCost: number; totalInQty: number }>();
  for (const [productId, { qty, val }] of agg) {
    if (qty > 0) out.set(productId, { unitCost: val / qty, totalInQty: qty });
  }
  return out;
}
