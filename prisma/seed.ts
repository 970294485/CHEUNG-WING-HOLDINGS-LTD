import {
  PrismaClient,
  GlAccountType,
  JournalEntryStatus,
  BudgetType,
  PaymentRequestStatus,
  ArApStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.upsert({
    where: { code: "DEMO" },
    create: { name: "演示公司", code: "DEMO" },
    update: { name: "演示公司" },
  });

  const catDefs = [
    { code: "GEN", name: "一般", description: "一般业务" },
    { code: "SAL", name: "销售", description: "销售相关" },
    { code: "ADM", name: "行政", description: "行政费用" },
  ];
  for (const c of catDefs) {
    await prisma.accountingCategory.upsert({
      where: { companyId_code: { companyId: company.id, code: c.code } },
      create: { ...c, companyId: company.id },
      update: { name: c.name, description: c.description },
    });
  }

  const accounts: { code: string; name: string; type: GlAccountType; sortOrder: number }[] = [
    { code: "1000", name: "库存现金", type: "ASSET", sortOrder: 10 },
    { code: "1100", name: "银行存款", type: "ASSET", sortOrder: 20 },
    { code: "1200", name: "应收账款", type: "ASSET", sortOrder: 30 },
    { code: "2000", name: "应付账款", type: "LIABILITY", sortOrder: 40 },
    { code: "3000", name: "实收资本", type: "EQUITY", sortOrder: 50 },
    { code: "4000", name: "营业收入", type: "REVENUE", sortOrder: 60 },
    { code: "5000", name: "营业成本", type: "EXPENSE", sortOrder: 70 },
    { code: "5100", name: "管理费用", type: "EXPENSE", sortOrder: 80 },
  ];

  const glByCode: Record<string, string> = {};
  for (const a of accounts) {
    const row = await prisma.glAccount.upsert({
      where: { companyId_code: { companyId: company.id, code: a.code } },
      create: { ...a, companyId: company.id },
      update: { name: a.name, type: a.type, sortOrder: a.sortOrder },
    });
    glByCode[a.code] = row.id;
  }

  const genCat = await prisma.accountingCategory.findFirst({
    where: { companyId: company.id, code: "GEN" },
  });
  if (!genCat) throw new Error("seed: category GEN missing");

  await prisma.journalEntry.deleteMany({
    where: { companyId: company.id, entryNo: { startsWith: "JE-" } },
  });

  const y = new Date().getFullYear();
  const m = new Date().getMonth();
  const d1 = new Date(y, m, 5);
  const d2 = new Date(y, m, 12);
  const mm = String(m + 1).padStart(2, "0");

  await prisma.journalEntry.create({
    data: {
      companyId: company.id,
      entryNo: `JE-${y}${mm}-001`,
      entryDate: d1,
      description: "确认收入（演示）",
      status: JournalEntryStatus.POSTED,
      lines: {
        create: [
          {
            glAccountId: glByCode["1100"]!,
            debit: 50000,
            credit: 0,
            memo: "银行收款",
            accountingCategoryId: genCat.id,
          },
          {
            glAccountId: glByCode["4000"]!,
            debit: 0,
            credit: 50000,
            memo: "营业收入",
            accountingCategoryId: genCat.id,
          },
        ],
      },
    },
  });

  await prisma.journalEntry.create({
    data: {
      companyId: company.id,
      entryNo: `JE-${y}${mm}-002`,
      entryDate: d2,
      description: "支付费用（演示）",
      status: JournalEntryStatus.POSTED,
      lines: {
        create: [
          {
            glAccountId: glByCode["5100"]!,
            debit: 8000,
            credit: 0,
            memo: "管理费用",
            accountingCategoryId: genCat.id,
          },
          {
            glAccountId: glByCode["1100"]!,
            debit: 0,
            credit: 8000,
            memo: "银行付款",
            accountingCategoryId: genCat.id,
          },
        ],
      },
    },
  });

  await prisma.budgetLine.upsert({
    where: {
      companyId_year_month_glAccountId_budgetType: {
        companyId: company.id,
        year: y,
        month: m + 1,
        glAccountId: glByCode["4000"]!,
        budgetType: BudgetType.REVENUE,
      },
    },
    create: {
      companyId: company.id,
      year: y,
      month: m + 1,
      glAccountId: glByCode["4000"]!,
      amount: 60000,
      budgetType: BudgetType.REVENUE,
      note: "月度收入预算",
    },
    update: { amount: 60000 },
  });

  await prisma.budgetLine.upsert({
    where: {
      companyId_year_month_glAccountId_budgetType: {
        companyId: company.id,
        year: y,
        month: m + 1,
        glAccountId: glByCode["5100"]!,
        budgetType: BudgetType.EXPENSE,
      },
    },
    create: {
      companyId: company.id,
      year: y,
      month: m + 1,
      glAccountId: glByCode["5100"]!,
      amount: 10000,
      budgetType: BudgetType.EXPENSE,
      note: "月度费用预算",
    },
    update: { amount: 10000 },
  });

  await prisma.paymentRequest.deleteMany({
    where: { companyId: company.id, title: "办公用品采购请款（演示）" },
  });
  await prisma.paymentRequest.create({
    data: {
      companyId: company.id,
      title: "办公用品采购请款（演示）",
      amount: 3200,
      purpose: "采购打印耗材",
      status: PaymentRequestStatus.SUBMITTED,
      requestedBy: "演示用户",
      approverRole: "finance_manager",
    },
  });

  await prisma.prepayment.deleteMany({
    where: { companyId: company.id, reference: "DEMO-PREP-1" },
  });
  await prisma.prepayment.create({
    data: {
      companyId: company.id,
      amount: 10000,
      payerName: "演示客户 A",
      reference: "DEMO-PREP-1",
      linkedDocumentType: "CONTRACT",
      linkedDocumentId: "CTR-DEMO-001",
    },
  });

  await prisma.accountsReceivable.deleteMany({
    where: { companyId: company.id, invoiceNo: "INV-DEMO-001" },
  });
  await prisma.accountsReceivable.create({
    data: {
      companyId: company.id,
      customerName: "演示客户 B",
      description: "项目尾款",
      amount: 12000,
      receivedAmount: 0,
      invoiceNo: "INV-DEMO-001",
      dueDate: new Date(y, m + 1, 1),
      status: ArApStatus.OPEN,
    },
  });

  await prisma.accountsPayable.deleteMany({
    where: { companyId: company.id, billNo: "BILL-DEMO-001" },
  });
  await prisma.accountsPayable.create({
    data: {
      companyId: company.id,
      vendorName: "演示供应商",
      description: "物料采购",
      amount: 15000,
      paidAmount: 5000,
      billNo: "BILL-DEMO-001",
      dueDate: new Date(y, m + 1, 15),
      status: ArApStatus.PARTIAL,
    },
  });

  const passwordHash = bcrypt.hashSync("demo123", 10);
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@tvp.local" },
    create: {
      email: "demo@tvp.local",
      passwordHash,
      name: "演示用户",
    },
    update: { passwordHash, name: "演示用户" },
  });

  // --- RBAC Seed ---
  const adminRole = await prisma.role.upsert({
    where: { companyId_name: { companyId: company.id, name: "Admin" } },
    create: {
      companyId: company.id,
      name: "Admin",
      description: "系统管理员",
    },
    update: { description: "系统管理员" },
  });

  const financeRole = await prisma.role.upsert({
    where: { companyId_name: { companyId: company.id, name: "Finance" } },
    create: {
      companyId: company.id,
      name: "Finance",
      description: "财务人员",
    },
    update: { description: "财务人员" },
  });

  const salesRole = await prisma.role.upsert({
    where: { companyId_name: { companyId: company.id, name: "Sales" } },
    create: {
      companyId: company.id,
      name: "Sales",
      description: "销售人员",
    },
    update: { description: "销售人员" },
  });

  const warehouseRole = await prisma.role.upsert({
    where: { companyId_name: { companyId: company.id, name: "Warehouse" } },
    create: {
      companyId: company.id,
      name: "Warehouse",
      description: "仓库管理员",
    },
    update: { description: "仓库管理员" },
  });

  const staffRole = await prisma.role.upsert({
    where: { companyId_name: { companyId: company.id, name: "Staff" } },
    create: {
      companyId: company.id,
      name: "Staff",
      description: "普通员工",
    },
    update: { description: "普通员工" },
  });

  const allPerm = await prisma.permission.upsert({
    where: { action_resource: { action: "manage", resource: "all" } },
    create: { action: "manage", resource: "all", description: "所有权限" },
    update: { description: "所有权限" },
  });

  const readPerm = await prisma.permission.upsert({
    where: { action_resource: { action: "read", resource: "all" } },
    create: { action: "read", resource: "all", description: "只读权限" },
    update: { description: "只读权限" },
  });

  await prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId: adminRole.id, permissionId: allPerm.id } },
    create: { roleId: adminRole.id, permissionId: allPerm.id },
    update: {},
  });

  await prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId: staffRole.id, permissionId: readPerm.id } },
    create: { roleId: staffRole.id, permissionId: readPerm.id },
    update: {},
  });

  await prisma.userRole.upsert({
    where: { userId_roleId_companyId: { userId: demoUser.id, roleId: adminRole.id, companyId: company.id } },
    create: { userId: demoUser.id, roleId: adminRole.id, companyId: company.id },
    update: {},
  });
  // --- End RBAC Seed ---

  // --- Products & Inventory ---
  const product1 = await prisma.product.upsert({
    where: { companyId_sku: { companyId: company.id, sku: "PROD-001" } },
    create: {
      companyId: company.id,
      sku: "PROD-001",
      name: "演示产品 A",
      description: "用于演示的高级产品",
      price: 199.99,
      cost: 100.00,
    },
    update: { name: "演示产品 A", price: 199.99, cost: 100.00 },
  });

  const product2 = await prisma.product.upsert({
    where: { companyId_sku: { companyId: company.id, sku: "PROD-002" } },
    create: {
      companyId: company.id,
      sku: "PROD-002",
      name: "演示产品 B",
      description: "用于演示的基础产品",
      price: 49.99,
      cost: 20.00,
    },
    update: { name: "演示产品 B", price: 49.99, cost: 20.00 },
  });

  await prisma.inventoryBalance.upsert({
    where: { companyId_productId_warehouseId: { companyId: company.id, productId: product1.id, warehouseId: "WH-MAIN" } },
    create: {
      companyId: company.id,
      productId: product1.id,
      warehouseId: "WH-MAIN",
      quantity: 150,
    },
    update: { quantity: 150 },
  });

  await prisma.inventoryTransaction.create({
    data: {
      companyId: company.id,
      productId: product1.id,
      type: "IN",
      quantity: 150,
      unitCost: 100.00,
      referenceType: "INITIAL",
      createdBy: demoUser.id,
    }
  });

  // --- Customers & Sales ---
  const customerGroup = await prisma.customerGroup.upsert({
    where: { companyId_name: { companyId: company.id, name: "VIP客户" } },
    create: {
      companyId: company.id,
      name: "VIP客户",
      description: "重要客户群体",
    },
    update: { description: "重要客户群体" },
  });

  const customer1 = await prisma.customer.upsert({
    where: { companyId_code: { companyId: company.id, code: "CUST-001" } },
    create: {
      companyId: company.id,
      code: "CUST-001",
      name: "演示科技有限公司",
      contactPerson: "张总",
      email: "zhang@example.com",
      phone: "13800138000",
      groupId: customerGroup.id,
      status: "ACTIVE",
    },
    update: { name: "演示科技有限公司", contactPerson: "张总" },
  });

  await prisma.customerFollowUp.create({
    data: {
      customerId: customer1.id,
      type: "MEETING",
      content: "初次拜访，客户对产品A很感兴趣，计划下周出报价单。",
      createdBy: demoUser.id,
    }
  });

  const salesDoc = await prisma.salesDocument.upsert({
    where: { companyId_type_documentNo: { companyId: company.id, type: "QUOTATION", documentNo: "QT-202603-001" } },
    create: {
      companyId: company.id,
      type: "QUOTATION",
      documentNo: "QT-202603-001",
      customerId: customer1.id,
      totalAmount: 1999.90,
      status: "PENDING",
      items: {
        create: [
          {
            productId: product1.id,
            quantity: 10,
            unitPrice: 199.99,
            total: 1999.90,
          }
        ]
      }
    },
    update: { totalAmount: 1999.90 },
  });

  // --- Document Rules ---
  await prisma.documentNumberRule.upsert({
    where: { companyId_documentType: { companyId: company.id, documentType: "QUOTATION" } },
    create: {
      companyId: company.id,
      documentType: "QUOTATION",
      prefix: "QT-",
      dateFormat: "YYYYMM",
      sequenceLen: 3,
      currentSeq: 1,
    },
    update: { currentSeq: 1 },
  });

  console.log("Seed OK:", company.code);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
