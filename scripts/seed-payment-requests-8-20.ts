/**
 * 將請款單第 8–20 行示例寫入 DEMO 公司（可重複執行：先按標題刪除再建立）。
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
  "銀行 TT 境外匯款手續費（4 月彙總）",
  "會計師行月度入帳支援（4 月）",
  "辦公耗材（紙張、色帶、倉庫標籤）",
  "寬頻及固網（5 月）",
  "冷鏈倉溫度監控雲端服務（季付）",
  "臨時加班裝車（夜間櫃到）",
  "代客小袋分裝費（單次訂單）",
  "產品圖片及規格書翻譯（英中）",
  "展會名片與單頁印刷（小額）",
  "產地證書加急代辦",
  "倉租月費（5 月，標準庫位）",
  "員工差旅（廣州驗貨一日）",
  "辦公室飲水及清潔服務（4–5 月）",
] as const;

const ROWS: Row[] = [
  {
    title: TITLES[0],
    amount: 2340,
    department: "財務部",
    purpose: "多筆 TT 手續費合併請款",
    status: "PAID",
    requestedBy: "蘇靖雯",
    category: "其他",
  },
  {
    title: TITLES[1],
    amount: 8800,
    department: "財務部",
    purpose: "月結帳務整理及報表覆核",
    status: "PAID",
    requestedBy: "崔曜廷",
    category: "其他",
  },
  {
    title: TITLES[2],
    amount: 1120,
    department: "行政部",
    purpose: "行政與倉庫共用耗材",
    status: "SUBMITTED",
    requestedBy: "鄺沛琳",
    category: "文具",
  },
  {
    title: TITLES[3],
    amount: 1090,
    department: "行政部",
    purpose: "寫字樓專線月費",
    status: "APPROVED",
    requestedBy: "謝承希",
    category: "其他",
  },
  {
    title: TITLES[4],
    amount: 14600,
    department: "品質與合規部",
    purpose: "溫度記錄雲端訂閱 Q2",
    status: "PAID",
    requestedBy: "方樂瑤",
    category: "其他",
  },
  {
    title: TITLES[5],
    amount: 3600,
    department: "物流倉儲部",
    purpose: "夜間到櫃裝卸津貼",
    status: "SUBMITTED",
    requestedBy: "石韜",
    category: "其他",
  },
  {
    title: TITLES[6],
    amount: 22400,
    department: "物流倉儲部",
    purpose: "依工單分裝出貨",
    status: "APPROVED",
    requestedBy: "譚穎心",
    category: "物流",
  },
  {
    title: TITLES[7],
    amount: 5200,
    department: "市場部",
    purpose: "報關及客戶上架用文件",
    status: "PAID",
    requestedBy: "關子謙",
    category: "其他",
  },
  {
    title: TITLES[8],
    amount: 2680,
    department: "市場部",
    purpose: "本地印刷小批量",
    status: "DRAFT",
    requestedBy: "譚穎心",
    category: "其他",
  },
  {
    title: TITLES[9],
    amount: 3150,
    department: "物流倉儲部",
    purpose: "加急出證代理費",
    status: "REJECTED",
    requestedBy: "莊詩穎",
    category: "物流",
  },
  {
    title: TITLES[10],
    amount: 46500,
    department: "物流倉儲部",
    purpose: "恆溫庫位月租",
    status: "SUBMITTED",
    requestedBy: "鍾曉彤",
    category: "物流",
  },
  {
    title: TITLES[11],
    amount: 2980,
    department: "品質與合規部",
    purpose: "高鐵、餐費實報",
    status: "PAID",
    requestedBy: "馮柏言",
    category: "差旅",
  },
  {
    title: TITLES[12],
    amount: 1640,
    department: "行政部",
    purpose: "桶裝水與週清潔",
    status: "PAID",
    requestedBy: "鄺沛琳",
    category: "其他",
  },
];

async function main() {
  const company = await prisma.company.findFirst({ where: { code: "DEMO" } });
  if (!company) {
    console.error("找不到 code=DEMO 的公司");
    process.exit(1);
  }

  const del = await prisma.paymentRequest.deleteMany({
    where: { companyId: company.id, title: { in: [...TITLES] } },
  });
  console.log("已刪除同標題舊筆數:", del.count);

  for (const r of ROWS) {
    const approved =
      r.status === "APPROVED" || r.status === "REJECTED" || r.status === "PAID";
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
        approvedBy: approved ? "財務審批" : null,
        approvedAt: approved ? new Date("2026-04-15T10:00:00.000Z") : null,
      },
    });
  }

  console.log("已在 DEMO 寫入請款單", ROWS.length, "筆（原表第 8–20 行；14–16 申請人為譚穎心/關子謙以避免與客戶名混淆）。");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
