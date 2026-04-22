import type { PrismaClient } from "@prisma/client";
import { PurchaseOrderStatus } from "@prisma/client";
import { syncNutCatalog } from "../../products/list/nut-catalog";

/** 與「龍盛環球」發票風格一致的內部採購單號（2026 年 Q2 實務編碼） */
export const Q2_SEED_PO_NUMBERS = [
  "PO-HK-2603-0088",
  "PO-HK-2603-0192",
  "PO-HK-2603-0312",
  "PO-HK-2604-0083",
  "PO-HK-2604-0167",
  "PO-HK-2604-0266",
  "PO-HK-2605-0091",
  "PO-HK-2605-0194",
  "PO-HK-2605-0707",
  "PO-HK-2605-0288",
  "PO-HK-2606-0099",
  "PO-HK-2606-0178",
  "PO-HK-2606-0618",
] as const;

type NutSku = "PROD-001" | "PROD-002" | "PROD-003" | "PROD-004";
type Q2Sku = NutSku | "MAC-B-INSHELL-KG";

type Q2OrderSeed = {
  poNumber: (typeof Q2_SEED_PO_NUMBERS)[number];
  /** UTC 日曆日（月為 1–12） */
  year: number;
  month: number;
  day: number;
  sku: Q2Sku;
  quantityKg: number;
  unitPriceHkd: number;
  vendorName: string;
  status: PurchaseOrderStatus;
  expectedDaysAfter: number | null;
  notes: string;
};

const Q2_ORDERS: Q2OrderSeed[] = [
  {
    poNumber: "PO-HK-2603-0088",
    year: 2026,
    month: 3,
    day: 8,
    sku: "PROD-001",
    quantityKg: 2800,
    unitPriceHkd: 116.5,
    vendorName: "龍盛環球有限公司 / DRAGON WELL GLOBAL LIMITED",
    status: PurchaseOrderStatus.APPROVED,
    expectedDaysAfter: 18,
    notes:
      "合同參考：CW/PEC/26-Q1-08。碧根果（長壽果）一批，美國產區，港幣結算。付款條款：T/T 到單後 14 日內。裝運：香港至香港倉。附：植檢證副本、非木質包裝聲明。",
  },
  {
    poNumber: "PO-HK-2603-0192",
    year: 2026,
    month: 3,
    day: 22,
    sku: "PROD-002",
    quantityKg: 1900,
    unitPriceHkd: 128.2,
    vendorName: "龍盛環球有限公司 / DRAGON WELL GLOBAL LIMITED",
    status: PurchaseOrderStatus.COMPLETED,
    expectedDaysAfter: 12,
    notes:
      "開心果（原味）現貨採購，自然開口率依到港抽檢報告為準。發票抬頭：CHEUNG WING HOLDINGS LIMITED。已於 4 月初完成入倉與磅單核對。",
  },
  {
    poNumber: "PO-HK-2603-0312",
    year: 2026,
    month: 3,
    day: 12,
    sku: "MAC-B-INSHELL-KG",
    quantityKg: 22000,
    unitPriceHkd: 56,
    vendorName: "龍盛環球有限公司 / DRAGON WELL GLOBAL LIMITED",
    status: PurchaseOrderStatus.COMPLETED,
    expectedDaysAfter: 14,
    notes:
      "帶殼夏威夷果（B級）大宗到櫃；與倉儲約定卸貨時段 07:30–12:00。磅單淨重結算，磅差依合同 ±0.25%。對應入倉流水參考 SEED-PO-202603-312。",
  },
  {
    poNumber: "PO-HK-2604-0083",
    year: 2026,
    month: 4,
    day: 3,
    sku: "PROD-003",
    quantityKg: 4200,
    unitPriceHkd: 96.8,
    vendorName: "新疆果業集團（香港）供應鏈有限公司",
    status: PurchaseOrderStatus.APPROVED,
    expectedDaysAfter: 21,
    notes:
      "無殼核桃仁，阿克蘇產區，金屬探測與過篩報告隨貨。單價含內地至香港陸運及報關雜費。品名英文：SHELLED WALNUT KERNELS。",
  },
  {
    poNumber: "PO-HK-2604-0167",
    year: 2026,
    month: 4,
    day: 17,
    sku: "PROD-004",
    quantityKg: 3100,
    unitPriceHkd: 106.5,
    vendorName: "龍盛環球有限公司 / DRAGON WELL GLOBAL LIMITED",
    status: PurchaseOrderStatus.APPROVED,
    expectedDaysAfter: 14,
    notes:
      "巴旦木整仁（杏仁），加州 NP 級。貨幣：HKD。要求：水分、酸價、過氧化值符合入廠內控標準；不符可拒收並退運費由供方承擔。",
  },
  {
    poNumber: "PO-HK-2604-0266",
    year: 2026,
    month: 4,
    day: 26,
    sku: "PROD-001",
    quantityKg: 1500,
    unitPriceHkd: 118,
    vendorName: "龍盛環球有限公司 / DRAGON WELL GLOBAL LIMITED",
    status: PurchaseOrderStatus.PENDING,
    expectedDaysAfter: 20,
    notes:
      "補貨單：應節禮盒原料缺口。碧根果大果規格，到貨後三工作日內完成驗收。銀行收款資料同既有 DWG 發票模板（王道銀行 HKD 賬戶）。",
  },
  {
    poNumber: "PO-HK-2605-0091",
    year: 2026,
    month: 5,
    day: 7,
    sku: "PROD-002",
    quantityKg: 5200,
    unitPriceHkd: 130.5,
    vendorName: "地中海堅果貿易（香港）有限公司",
    status: PurchaseOrderStatus.APPROVED,
    expectedDaysAfter: 16,
    notes:
      "開心果輕鹽焗烤，土耳其／美國混裝批次，外包裝須標示原產國。總金額依過磅淨重結算，磅差 ±0.3% 內按合同單價多退少補。",
  },
  {
    poNumber: "PO-HK-2605-0194",
    year: 2026,
    month: 5,
    day: 19,
    sku: "PROD-003",
    quantityKg: 3600,
    unitPriceHkd: 98.2,
    vendorName: "新疆果業集團（香港）供應鏈有限公司",
    status: PurchaseOrderStatus.COMPLETED,
    expectedDaysAfter: 10,
    notes:
      "核桃仁半片為主，用於烘焙餡料。已附 COA 與農殘檢測摘要。入倉單號 WH-HK-202605-4412。",
  },
  {
    poNumber: "PO-HK-2605-0707",
    year: 2026,
    month: 5,
    day: 7,
    sku: "MAC-B-INSHELL-KG",
    quantityKg: 18500,
    unitPriceHkd: 56.4,
    vendorName: "龍盛環球有限公司 / DRAGON WELL GLOBAL LIMITED",
    status: PurchaseOrderStatus.APPROVED,
    expectedDaysAfter: 18,
    notes:
      "二季度補櫃：帶殼夏威夷果 B 級，單價含香港本地倉到倉。貨代已預約 5/7 早班入倉；與庫存收貨記錄口徑一致（單價隨行市微調）。",
  },
  {
    poNumber: "PO-HK-2605-0288",
    year: 2026,
    month: 5,
    day: 28,
    sku: "PROD-004",
    quantityKg: 2200,
    unitPriceHkd: 107.8,
    vendorName: "龍盛環球有限公司 / DRAGON WELL GLOBAL LIMITED",
    status: PurchaseOrderStatus.APPROVED,
    expectedDaysAfter: 15,
    notes:
      "杏仁（巴旦木仁）現貨議價，單價為港幣每公斤。交貨地點：屯門工業城指定倉。聯絡：採購部陳先生（內線分機與既有合同一致）。",
  },
  {
    poNumber: "PO-HK-2606-0099",
    year: 2026,
    month: 6,
    day: 4,
    sku: "PROD-001",
    quantityKg: 4800,
    unitPriceHkd: 117.2,
    vendorName: "龍盛環球有限公司 / DRAGON WELL GLOBAL LIMITED",
    status: PurchaseOrderStatus.APPROVED,
    expectedDaysAfter: 22,
    notes:
      "二季度集中採購：碧根果，用於分裝線與禮盒套組。要求充氮包裝到港後轉倉 48 小時內完成卸貨，避免梅雨季受潮。",
  },
  {
    poNumber: "PO-HK-2606-0178",
    year: 2026,
    month: 6,
    day: 18,
    sku: "PROD-002",
    quantityKg: 2400,
    unitPriceHkd: 129,
    vendorName: "地中海堅果貿易（香港）有限公司",
    status: PurchaseOrderStatus.COMPLETED,
    expectedDaysAfter: 11,
    notes:
      "開心果最後一批夏採前補單。買方：CHEUNG WING HOLDINGS LIMITED（內部成本中心：堅果事業部）。貨幣 HKD，總額以本採購單為準。",
  },
  {
    poNumber: "PO-HK-2606-0618",
    year: 2026,
    month: 6,
    day: 18,
    sku: "MAC-B-INSHELL-KG",
    quantityKg: 12000,
    unitPriceHkd: 57.1,
    vendorName: "龍盛環球有限公司 / DRAGON WELL GLOBAL LIMITED",
    status: PurchaseOrderStatus.COMPLETED,
    expectedDaysAfter: 12,
    notes:
      "半年結前最後一櫃夏威夷果；品管已抽檢外觀與含水率。付款：發票開立後 T/T 14 日。與 6 月中旬入庫批次對齊。",
  },
];

function orderDateUtc(y: number, month1to12: number, day: number): Date {
  return new Date(Date.UTC(y, month1to12 - 1, day, 12, 0, 0, 0));
}

/**
 * 寫入 2026 年 3–6 月採購單（堅果四品項＋帶殼夏威夷果大宗），單價／數量與庫存種子、港幣 kg 口徑一致。
 * 冪等：依單號 upsert 主檔並替換明細。會呼叫 syncNutCatalog 以確保 PROD-001–004 存在。
 */
export async function ensureQ2NutPurchaseOrders(db: PrismaClient, companyId: string): Promise<void> {
  await syncNutCatalog(db, companyId);

  const skus: Q2Sku[] = ["PROD-001", "PROD-002", "PROD-003", "PROD-004", "MAC-B-INSHELL-KG"];
  const skuToId = {} as Record<Q2Sku, string>;

  for (const sku of skus) {
    const p = await db.product.findUnique({
      where: { companyId_sku: { companyId, sku } },
      select: { id: true },
    });
    if (!p) {
      throw new Error(`採購單種子需要產品 ${sku}；請確認已執行 syncNutCatalog 及 MAC-B-INSHELL-KG 主檔。`);
    }
    skuToId[sku] = p.id;
  }

  for (const row of Q2_ORDERS) {
    const qty = Math.round(row.quantityKg);
    const unit = row.unitPriceHkd;
    const total = Math.round(qty * unit * 100) / 100;
    const orderDate = orderDateUtc(row.year, row.month, row.day);
    const expectedDate =
      row.expectedDaysAfter != null
        ? new Date(orderDate.getTime() + row.expectedDaysAfter * 86400000)
        : null;

    const header = {
      vendorName: row.vendorName,
      date: orderDate,
      expectedDate,
      totalAmount: total,
      status: row.status,
      notes: row.notes,
    };

    const line = {
      productId: skuToId[row.sku],
      quantity: qty,
      unitPrice: unit,
      total,
    };

    // 單次 upsert + 巢狀明細（避免互動式 $transaction；Neon 連線池下易 P2028）
    await db.purchaseOrder.upsert({
      where: { companyId_poNumber: { companyId, poNumber: row.poNumber } },
      create: {
        companyId,
        poNumber: row.poNumber,
        ...header,
        items: { create: [line] },
      },
      update: {
        ...header,
        items: { deleteMany: {}, create: [line] },
      },
    });
  }
}
