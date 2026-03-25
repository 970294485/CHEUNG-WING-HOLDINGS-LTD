import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "app", "(workspace)");

/** [dir, title, subtitle?] */
const pages = [
  ["financial/contract-invoice-prepay", "合同与发票预收对接", "预收与合同、发票核销联动。"],
  ["financial/monthly-budget-stats", "月度预算统计", "按部门/科目汇总预算执行率。"],
  ["financial/analysis-reports", "财务分析报告", "现金流、预收占用与多维分析。"],
  ["financial/approval-permissions", "审批权限设置", "请款与预算调整的审批流与角色。"],
  ["sales/quotes", "报价 / 见积管理", ""],
  ["sales/contracts", "合同管理", ""],
  ["sales/proforma-invoices", "预收发票", ""],
  ["sales/pdf-export", "PDF 格式导出", ""],
  ["sales/analysis", "销售分析报告", ""],
  ["sales/inventory-procurement", "库存与采购对接", ""],
  ["sales/finance-commission", "财务与佣金整合", ""],
  ["exports/invoices", "发票导出（Excel 等）", ""],
  ["exports/quotations", "报价单导出", ""],
  ["exports/delivery-notes", "送货单导出", ""],
  ["exports/payment-requests", "付款请求导出", ""],
  ["files/categories", "文件分类", ""],
  ["files/personal-drive", "个人网盘", "上传下载、分享与分类。"],
  ["files/public-library", "公共文件库", "面向内部员工的共享空间。"],
  ["customers/charts", "客户分析图表", ""],
  ["customers/sales-orders", "销售开单管理", ""],
  ["customers/analysis", "客户分析管理", ""],
  ["customers/groups-followup-sources", "分组 / 跟进 / 来源", ""],
  ["customers/email-promotion", "推广邮件（Email）", ""],
  ["data-entry/company-profile", "公司基本资料", ""],
  ["data-entry/company-permissions", "公司权限设定", ""],
  ["data-entry/role-permissions", "级别权限设定", ""],
  ["data-entry/users", "用户资料输入", ""],
  ["data-entry/document-numbers", "单据编号规则", ""],
  ["data-entry/product-master", "产品资料输入", "与「产品管理」主数据联动。"],
  ["data-entry/accounting/ledger-items", "会计入账项目", "可与「会计功能 → 会计科目」同步维护。"],
  ["data-entry/accounting/categories", "会计类别输入", "可与「会计功能 → 会计类别」同步维护。"],
  ["data-entry/documents/quotes-contracts", "报价单与合同资料", ""],
  ["data-entry/purchase-orders", "采购单资料", ""],
  ["data-entry/warehouse-stock", "仓存数据输入", ""],
  ["products/basic-info", "产品基础信息", "名称、SKU、条码等。"],
  ["products/specs-media", "规格与图片/视频", ""],
  ["products/types-attributes", "类型与子类型、属性", ""],
  ["products/pricing", "产品价格", ""],
  ["products/accessories-bom", "配件与 BOM", ""],
  ["products/export", "产品导出 Excel / PDF", ""],
];

function esc(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, " ");
}

for (const [dir, title, sub] of pages) {
  const d = path.join(root, dir);
  fs.mkdirSync(d, { recursive: true });
  const subProp = sub ? ` subtitle="${esc(sub)}"` : "";
  const body = `import { SectionPlaceholder } from "@/components/section-placeholder";

export default function Page() {
  return <SectionPlaceholder title="${esc(title)}"${subProp} />;
}
`;
  fs.writeFileSync(path.join(d, "page.tsx"), body, "utf8");
}

console.log("Wrote", pages.length, "placeholder pages");
