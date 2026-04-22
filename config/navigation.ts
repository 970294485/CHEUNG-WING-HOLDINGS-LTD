export type NavItem = { title: string; href: string };
export type NavSection = { id: string; title: string; items: NavItem[] };

export const NAV_SECTIONS: NavSection[] = [
  {
    id: "sales-customers",
    title: "銷售與客戶 (Sales)",
    items: [
      { title: "客戶檔案管理", href: "/customers/list" },
      { title: "報價單管理", href: "/sales/quotes" },
      { title: "合同管理", href: "/sales/contracts" },
      { title: "預收發票", href: "/sales/proforma-invoices" },
      { title: "銷售開單管理", href: "/customers/sales-orders" },
      { title: "客戶跟進與分組", href: "/customers/groups-followup-sources" },
      { title: "發送推廣訊息", href: "/customers/email-promotion" },
      { title: "銷售分析", href: "/sales/analysis" },
      { title: "客戶分析", href: "/customers/analysis" },
    ],
  },
  {
    id: "finance-accounting",
    title: "財務與會計 (Finance)",
    items: [
      { title: "預收款項管理", href: "/financial/prepayments" },
      { title: "預收款對接", href: "/financial/contract-invoice-prepay" },
      { title: "應收帳款管理", href: "/accounting/ar" },
      { title: "應付帳款管理", href: "/accounting/ap" },
      { title: "請款單管理", href: "/financial/payment-requests" },
      { title: "會計憑證記錄", href: "/accounting/journals" },
      { title: "總帳管理", href: "/accounting/ledger" },
      { title: "資產負債表 (BS)", href: "/accounting/reports/bs" },
      { title: "利潤和損失表 (PL)", href: "/accounting/reports/pl" },
      { title: "月度預算與收支", href: "/financial/budget" },
      { title: "財務分析報告", href: "/financial/analysis-reports" },
      { title: "財務與佣金整合", href: "/sales/finance-commission" },
    ],
  },
  {
    id: "product-inventory",
    title: "產品與庫存 (Products)",
    items: [
      { title: "產品列表", href: "/products/list" },
      { title: "產品基礎資料", href: "/products/basic-info" },
      { title: "產品類型與屬性", href: "/products/types-attributes" },
      { title: "產品價格管理", href: "/products/pricing" },
      { title: "出入庫存管理", href: "/inventory/transactions" },
      { title: "詳細庫存與成本", href: "/inventory/details" },
      { title: "採購單管理", href: "/data-entry/purchase-orders" },
      { title: "庫存及採購對接", href: "/sales/inventory-procurement" },
    ],
  },
  {
    id: "documents-export",
    title: "文件與導出 (Documents)",
    items: [
      { title: "企業文件庫", href: "/files/categories" },
      { title: "個人網盤", href: "/files/personal-drive" },
      { title: "公共文件數據庫", href: "/files/public-library" },
      { title: "報價單/合同導出", href: "/exports/quotations" },
      { title: "發票導出", href: "/exports/invoices" },
      { title: "送貨單導出", href: "/exports/delivery-notes" },
      { title: "產品資料導出", href: "/products/export" },
    ],
  },
  {
    id: "system-settings",
    title: "系統設定 (Settings)",
    items: [
      { title: "公司基本資料", href: "/data-entry/company-profile" },
      { title: "用戶與權限管理", href: "/data-entry/users" },
      { title: "角色權限管理 (RBAC)", href: "/data-entry/role-permissions" },
      { title: "單號生成規則", href: "/data-entry/document-numbers" },
      { title: "會計科目與類別", href: "/accounting/accounts" },
      { title: "審批權限設置", href: "/financial/approval-permissions" },
    ],
  },
];
