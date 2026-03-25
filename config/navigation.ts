export type NavItem = { title: string; href: string };
export type NavSection = { id: string; title: string; items: NavItem[] };

export const NAV_SECTIONS: NavSection[] = [
  {
    id: "financial",
    title: "財務功能",
    items: [
      { title: "管理請款單", href: "/financial/payment-requests" },
      { title: "預收款項管理", href: "/financial/prepayments" },
      { title: "合同與發票的預收款對接", href: "/financial/contract-invoice-prepay" },
      { title: "月度預算統計與收支管理", href: "/financial/budget" },
      { title: "財務分析的報告", href: "/financial/analysis-reports" },
      { title: "審批權限設置", href: "/financial/approval-permissions" },
    ],
  },
  {
    id: "accounting",
    title: "會計功能",
    items: [
      { title: "會計記錄管理", href: "/accounting/journals" },
      { title: "應收帳管理", href: "/accounting/ar" },
      { title: "應付帳管理", href: "/accounting/ap" },
      { title: "利潤和損失表", href: "/accounting/reports/pl" },
      { title: "企業資產負債表", href: "/accounting/reports/bs" },
      { title: "總帳管理", href: "/accounting/ledger" },
      { title: "入帳項目設置", href: "/accounting/accounts" },
      { title: "類別設置", href: "/accounting/categories" },
    ],
  },
  {
    id: "sales",
    title: "銷售功能",
    items: [
      { title: "見積管理功能", href: "/sales/quotes" },
      { title: "合同管理功能", href: "/sales/contracts" },
      { title: "預收發票功能", href: "/sales/proforma-invoices" },
      { title: "分析報告功能", href: "/sales/analysis" },
      { title: "庫存及採購對接", href: "/sales/inventory-procurement" },
      { title: "財務與佣金的整合", href: "/sales/finance-commission" },
    ],
  },
  {
    id: "document-export",
    title: "文件導出功能",
    items: [
      { title: "發票導出功能", href: "/exports/invoices" },
      { title: "報價單導出功能", href: "/exports/quotations" },
      { title: "送貨單導出功能", href: "/exports/delivery-notes" },
      { title: "付款請求導出功能", href: "/exports/payment-requests" },
    ],
  },
  {
    id: "file-management",
    title: "文件管理功能",
    items: [
      { title: "文件分類功能", href: "/files/categories" },
      { title: "個人網盤功能", href: "/files/personal-drive" },
      { title: "公共文件資料庫", href: "/files/public-library" },
    ],
  },
  {
    id: "customer-management",
    title: "客戶管理",
    items: [
      { title: "客戶分析圖表", href: "/customers/charts" },
      { title: "銷售開單管理", href: "/customers/sales-orders" },
      { title: "客戶分析管理", href: "/customers/analysis" },
      { title: "分組/跟進/來源管理", href: "/customers/groups-followup-sources" },
      { title: "發送推廣訊息(Email)", href: "/customers/email-promotion" },
    ],
  },
  {
    id: "data-entry",
    title: "資料輸入",
    items: [
      { title: "基本公司資料輸入", href: "/data-entry/company-profile" },
      { title: "公司權限設定", href: "/data-entry/company-permissions" },
      { title: "級別權限設定", href: "/data-entry/role-permissions" },
      { title: "用戶資料輸入", href: "/data-entry/users" },
      { title: "公司基本文件單號輸入", href: "/data-entry/document-numbers" },
      { title: "產品資料輸入", href: "/data-entry/product-master" },
      { title: "會計入帳項目輸入", href: "/data-entry/accounting/ledger-items" },
      { title: "會計類別輸入", href: "/data-entry/accounting/categories" },
      { title: "報價單和合同", href: "/data-entry/documents/quotes-contracts" },
      { title: "採購單", href: "/data-entry/purchase-orders" },
      { title: "倉存數據輸入", href: "/data-entry/warehouse-stock" },
    ],
  },
  {
    id: "product-management",
    title: "產品管理",
    items: [
      { title: "產品列表", href: "/products/list" },
      { title: "基礎資料輸入", href: "/products/basic-info" },
      { title: "類型/屬性/包裝/配件", href: "/products/types-attributes" },
      { title: "產品價格", href: "/products/pricing" },
      { title: "導出Excel/PDF", href: "/products/export" },
    ],
  },
];