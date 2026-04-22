import type { PrismaClient } from "@prisma/client";
import { PurchaseOrderStatus } from "@prisma/client";

const PO_NUMBER = "DWG20260201";
const PRODUCT_SKU = "RAW-MAC-B";

const INVOICE_NOTES = `【發票信息提取】對應單據：發票 INVOICE

1. 基本信息
- 單據類型：發票 (INVOICE)
- 發票日期：2026年2月9日
- 發票編號：${PO_NUMBER}
- 貨幣：港幣 (HKD / HK$)

2. 買賣雙方
賣方：龍盛環球有限公司 (DRAGON WELL GLOBAL LIMITED)
地址：RM602, 6/F., BLOCK 1, NAN FUNG INDUSTRIAL CITY, 18 TIN HAU ROAD, TUEN MUN, N.T., HONG KONG
電子郵件：dragon_well@outlook.com

買方：CHEUNG WING HOLDINGS LIMITED

3. 商品明細
- 帶殼夏威夷果（B級）/ INSHELL MACADAMIA NUTS (B GRADE)
- 數量：36,800 KGS
- 單價：HK$ 55.00 / KG
- 總額：HK$ 2,024,000.00

4. 物流與合計
裝運路徑：從香港到香港 (FROM HONG KONG TO HONG KONG)

5. 銀行收款信息
賬戶名稱：DRAGON WELL GLOBAL LIMITED
開戶銀行：王道商業銀行香港分行 (O-BANK CO., LTD HK BRANCH)
銀行賬號：20-00001103 (HKD)
銀行代碼：274
SWIFT：IBOTHKHH

備註：該文件包含授權簽署 (Authorized Signature)。`;

/**
 * 將 DWG20260201 發票對應的採購主數據寫入庫（供應商＝賣方龍盛環球；買方為採購方公司自用備註）。
 * 冪等：同一公司下若已存在相同採購單號則先刪後建，避免重複執行 seed/頁面載入產生多筆。
 */
export async function ensureDwgInvoicePurchaseOrder(db: PrismaClient, companyId: string): Promise<void> {
  const macProduct = await db.product.upsert({
    where: { companyId_sku: { companyId, sku: PRODUCT_SKU } },
    create: {
      companyId,
      sku: PRODUCT_SKU,
      name: "帶殼夏威夷果（B級）",
      barcode: "6950234517995",
      description: "INSHELL MACADAMIA NUTS (B GRADE)，大宗 kg 計價。",
      price: 55,
      cost: 50,
      attributes: {
        category: "堅果原料",
        subCategory: "夏威夷果",
        packaging: "大宗（KGS）",
        specs: { 計價幣別: "港幣 HKD", 計價單位: "每公斤" },
      },
    },
    update: {
      name: "帶殼夏威夷果（B級）",
      description: "INSHELL MACADAMIA NUTS (B GRADE)，大宗 kg 計價。",
      price: 55,
      cost: 50,
    },
  });

  const qty = 36800;
  const unitPrice = 55;
  const lineTotal = qty * unitPrice;

  const header = {
    vendorName: "龍盛環球有限公司 / DRAGON WELL GLOBAL LIMITED",
    date: new Date(Date.UTC(2026, 1, 9)),
    expectedDate: null as Date | null,
    totalAmount: lineTotal,
    status: PurchaseOrderStatus.APPROVED,
    notes: INVOICE_NOTES,
  };

  const line = {
    productId: macProduct.id,
    quantity: qty,
    unitPrice,
    total: lineTotal,
  };

  await db.purchaseOrder.upsert({
    where: { companyId_poNumber: { companyId, poNumber: PO_NUMBER } },
    create: {
      companyId,
      poNumber: PO_NUMBER,
      ...header,
      items: { create: [line] },
    },
    update: {
      ...header,
      items: { deleteMany: {}, create: [line] },
    },
  });
}
