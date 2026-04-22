/**
 * 將 20 筆偏真實業務場景的請款單寫入 code=DEMO 的公司。
 * 可重複執行：先依標題刪除同批舊資料再建立。
 *
 * Usage: npx tsx scripts/seed-payment-requests-realistic-20.ts
 */
import { PrismaClient, type PaymentRequestStatus } from "@prisma/client";

const prisma = new PrismaClient();

type Row = {
  title: string;
  amount: number;
  department: string;
  purpose: string;
  status: PaymentRequestStatus;
  requestedBy: string;
  category: string;
};

const TITLES = [
  "中環寫字樓 2026/04 管理費分攤",
  "葵青倉庫 4 月電費",
  "出口貨櫃拖車（鹽田→葵涌）",
  "SGS 堅果批次農殘複測",
  "阿里雲香港節點 5 月帳單",
  "員工團體醫保 2026 Q2 續期",
  "廣州驗貨高鐵及酒店",
  "冷鏈車隊 GPS 年費（12 個月）",
  "律所審閱海外經銷協議（英文版）",
  "辦公椅及升降桌採購",
  "展會（新加坡）攤位電力增容",
  "堅果金屬檢出機校準服務",
  "臨時夜班裝卸（週五櫃到）",
  "Microsoft 365 商務版（50 席位）",
  "產品攝影及白底圖修圖（兩 SKU）",
  "銀行 TT 境外供應商匯款手續費（4 月彙總）",
  "倉庫貨架安全檢測（年度）",
  "辦公室飲水機更換濾芯及年檢",
  "印尼供應商樣品空運（DAP 香港）",
  "會計師行 2025 年度審計費尾款",
] as const;

const ROWS: Row[] = [
  {
    title: TITLES[0],
    amount: 48_620,
    department: "行政部",
    purpose: "業主月結單，面積分攤後實付，附件為管理處收據。",
    status: "APPROVED",
    requestedBy: "黃婉婷",
    category: "其他",
  },
  {
    title: TITLES[1],
    amount: 31_480,
    department: "物流倉儲部",
    purpose: "港燈月結，尖峰時段略增，與上月對比已附表。",
    status: "PAID",
    requestedBy: "林志豪",
    category: "其他",
  },
  {
    title: TITLES[2],
    amount: 2_850,
    department: "物流倉儲部",
    purpose: "單櫃拖運，司機簽收單及 EIR 已掃描。",
    status: "SUBMITTED",
    requestedBy: "何家俊",
    category: "物流",
  },
  {
    title: TITLES[3],
    amount: 18_900,
    department: "品質與合規部",
    purpose: "客戶合同要求加測項目，報價單編號已註於備註欄。",
    status: "SUBMITTED",
    requestedBy: "周芷澄",
    category: "其他",
  },
  {
    title: TITLES[4],
    amount: 6_120,
    department: "資訊部",
    purpose: "OSS 與 RDS 合併帳單，按專案標籤分攤倉儲系統部分。",
    status: "APPROVED",
    requestedBy: "馬子軒",
    category: "其他",
  },
  {
    title: TITLES[5],
    amount: 112_400,
    department: "人力資源部",
    purpose: "經紀已出正式報價，待 HR 確認人數後提交。",
    status: "DRAFT",
    requestedBy: "蔡穎詩",
    category: "其他",
  },
  {
    title: TITLES[6],
    amount: 3_268,
    department: "品質與合規部",
    purpose: "高鐵二等座 + 一晚住宿，實報實銷，發票齊。",
    status: "PAID",
    requestedBy: "馮柏言",
    category: "差旅",
  },
  {
    title: TITLES[7],
    amount: 9_600,
    department: "物流倉儲部",
    purpose: "車隊 8 台設備續費，合約期 2026-05 起算。",
    status: "APPROVED",
    requestedBy: "石韜",
    category: "物流",
  },
  {
    title: TITLES[8],
    amount: 45_000,
    department: "財務部",
    purpose: "按小時報價封頂，階段一交付為條款清單與風險備忘。",
    status: "SUBMITTED",
    requestedBy: "崔曜廷",
    category: "其他",
  },
  {
    title: TITLES[9],
    amount: 22_600,
    department: "行政部",
    purpose: "採購未走三家報價，財務要求補齊比價後再提。",
    status: "REJECTED",
    requestedBy: "鄺沛琳",
    category: "文具",
  },
  {
    title: TITLES[10],
    amount: 8_400,
    department: "市場部",
    purpose: "主辦方加收費用，已附主辦方郵件確認。",
    status: "APPROVED",
    requestedBy: "關子謙",
    category: "其他",
  },
  {
    title: TITLES[11],
    amount: 5_500,
    department: "品質與合規部",
    purpose: "年度校準，證書編號已存檔。",
    status: "PAID",
    requestedBy: "方樂瑤",
    category: "其他",
  },
  {
    title: TITLES[12],
    amount: 4_200,
    department: "物流倉儲部",
    purpose: "外包隊伍 6 人 x 3.5 小時，現場主管簽字單。",
    status: "SUBMITTED",
    requestedBy: "鍾曉彤",
    category: "物流",
  },
  {
    title: TITLES[13],
    amount: 14_880,
    department: "資訊部",
    purpose: "年付折後價，與上次續費對照無異常。",
    status: "APPROVED",
    requestedBy: "馬子軒",
    category: "其他",
  },
  {
    title: TITLES[14],
    amount: 7_200,
    department: "市場部",
    purpose: "供電商平台上新，攝影師報價含三次小改。",
    status: "DRAFT",
    requestedBy: "譚穎心",
    category: "其他",
  },
  {
    title: TITLES[15],
    amount: 1_180,
    department: "財務部",
    purpose: "共 6 筆 TT 合併請款，水單號已列附件。",
    status: "PAID",
    requestedBy: "蘇靖雯",
    category: "其他",
  },
  {
    title: TITLES[16],
    amount: 16_000,
    department: "物流倉儲部",
    purpose: "第三方檢測機構報價，檢測範圍為 A 區高位貨架。",
    status: "SUBMITTED",
    requestedBy: "林志豪",
    category: "其他",
  },
  {
    title: TITLES[17],
    amount: 980,
    department: "行政部",
    purpose: "合約內含兩次上門，本次為第二次。",
    status: "APPROVED",
    requestedBy: "黃婉婷",
    category: "其他",
  },
  {
    title: TITLES[18],
    amount: 3_450,
    department: "採購部",
    purpose: "快遞單號與發票抬頭不一致，需供應商重開發票。",
    status: "REJECTED",
    requestedBy: "莊詩穎",
    category: "物流",
  },
  {
    title: TITLES[19],
    amount: 58_000,
    department: "財務部",
    purpose: "依審計合約階段三尾款，發票與合約編號已對齊。",
    status: "PAID",
    requestedBy: "崔曜廷",
    category: "其他",
  },
];

async function main() {
  const company = await prisma.company.findFirst({ where: { code: "DEMO" } });
  if (!company) {
    console.error("找不到 code=DEMO 的公司，請先執行 npm run db:seed");
    process.exit(1);
  }

  const del = await prisma.paymentRequest.deleteMany({
    where: { companyId: company.id, title: { in: [...TITLES] } },
  });
  console.log("已刪除同標題舊筆數:", del.count);

  const base = new Date("2026-04-10T09:00:00.000Z").getTime();
  let i = 0;
  for (const r of ROWS) {
    const needApproval =
      r.status === "APPROVED" || r.status === "REJECTED" || r.status === "PAID";
    const approvedAt = needApproval ? new Date(base + i * 3_600_000) : null;
    i += 1;
    await prisma.paymentRequest.create({
      data: {
        companyId: company.id,
        title: r.title,
        amount: r.amount,
        purpose: r.purpose,
        status: r.status,
        requestedBy: r.requestedBy,
        department: r.department,
        category: r.category,
        approverRole: "finance_manager",
        approvedBy: needApproval ? "財務審批" : null,
        approvedAt,
      },
    });
  }

  console.log("已在 DEMO 寫入請款單", ROWS.length, "筆（真實業務風格樣本）。");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
