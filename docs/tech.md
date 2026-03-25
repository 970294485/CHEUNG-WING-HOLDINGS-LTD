# 技术规格书 (Tech Spec)

> 本文档详述综合企业管理系统 (ERP/CRM) 的技术栈选型、系统架构、数据库设计、API 接口规范、文件存储方案以及部署环境要求。
>
> **前置阅读**：`docs/business_logic.md` — 业务流程、核心模块、数据流转。
>
> **文档索引**：`docs/README.md`

---

## 1. 技术栈选型

### 1.1 总览

| 层级 | 技术选型 | 版本要求 |
|------|---------|---------|
| **前端框架** | Next.js (App Router) | 14+ |
| **开发语言** | TypeScript | 5.0+ |
| **UI 组件库** | Tailwind CSS + Shadcn UI | 最新 |
| **状态管理** | Zustand (全局状态) + React Query (服务端状态) | 最新 |
| **后端 API** | Next.js Server Actions & Route Handlers | - |
| **数据库** | PostgreSQL | 15+ |
| **ORM 框架** | Prisma 或 Drizzle ORM | 最新 |
| **身份认证** | NextAuth.js (Auth.js) | v5 |
| **文件存储** | AWS S3 / Aliyun OSS / MinIO | - |
| **PDF 生成** | `@react-pdf/renderer` 或 Puppeteer | - |
| **Excel 生成** | `exceljs` | - |

### 1.2 选型理由
*   **Next.js (App Router)**：提供 React Server Components (RSC)，极大优化首屏加载速度，适合数据密集型的 ERP 系统；Server Actions 简化了前后端数据交互。
*   **PostgreSQL + JSONB**：ERP 系统需要强事务 (ACID) 保证财务数据一致性；同时 JSONB 字段完美契合「产品属性自由增加并多选」的动态需求。
*   **Shadcn UI + Tailwind**：提供高质量、可定制的无头组件，适合快速搭建复杂的后台管理界面。

---

## 2. 系统架构设计

系统采用 **B/S 架构**，基于 Next.js 实现前后端融合部署：

1.  **表现层 (Presentation Layer)**：
    *   使用 React Server Components 渲染静态部分，Client Components 处理交互（如多步表单、图表）。
2.  **业务逻辑层 (Business Logic Layer)**：
    *   通过 Server Actions 封装核心业务逻辑（如开单、审批、核算）。
    *   使用中间件 (Middleware) 进行全局路由鉴权。
3.  **数据访问层 (Data Access Layer)**：
    *   ORM 负责与 PostgreSQL 交互。
    *   **事务控制**：在订单生成、库存扣减、财务记账等跨模块操作时，强制使用数据库事务。
4.  **基础设施层 (Infrastructure Layer)**：
    *   云数据库、对象存储 (S3)、邮件发送服务 (SMTP/SendGrid)。

---

## 3. 核心模块技术实现

### 3.1 权限与安全控制 (RBAC)
*   **模型**：`User` -> `Role` -> `Permission`。
*   **实现**：
    *   中间件拦截：验证 Session，阻挡未授权的路由访问。
    *   Action 校验：在 Server Action 内部再次校验用户是否有执行该操作的权限（如 `checkPermission('CREATE_INVOICE')`）。

### 3.2 动态产品属性 (JSONB)
*   需求：产品属性自由增加并可以多选 (1.8)。
*   实现：在 `Product` 表中使用 `attributes` (JSONB) 字段。
    ```json
    // JSONB 存储示例
    {
      "材质": ["纯棉", "聚酯纤维"],
      "适用季节": ["春", "秋"],
      "保修期": "1年"
    }
    ```

### 3.3 文件管理与网盘 (1.5)
*   **直传方案**：后端生成 Pre-signed URL，前端直接将文件上传至 S3/OSS，避免占用应用服务器带宽。
*   **数据库映射**：`Files` 表记录文件元数据（S3 Key、文件名、大小、上传者、所属目录 ID）。
*   **权限隔离**：通过 `owner_id` 和 `shared_with` 字段控制个人网盘与公共数据库的可见性。

### 3.4 财务高精度计算 (1.1, 1.2)
*   **痛点**：JavaScript 浮点数精度丢失问题（如 `0.1 + 0.2 !== 0.3`）。
*   **方案**：
    *   数据库层面：金额字段统一使用 `DECIMAL(19,4)` 或以分为单位的 `INTEGER`。
    *   代码层面：使用 `decimal.js` 或 `bignumber.js` 进行所有财务金额的加减乘除运算。

---

## 4. 数据库 Schema 设计 (核心 ER 模型)

### 4.1 基础与权限表
*   `users`: id, name, email, password_hash, role_id
*   `roles`: id, name, permissions (JSONB)
*   `company_settings`: id, name, invoice_prefix, ...

### 4.2 客户与销售表
*   `customers`: id, name, group, source, follow_up_status
*   `quotations` (見積): id, customer_id, total_amount, status
*   `contracts`: id, quotation_id, status
*   `invoices` (发票): id, contract_id, type (预收/正式), amount

### 4.3 产品与库存表
*   `products`: id, sku, name, type, attributes (JSONB), price, images (JSONB)
*   `inventory`: id, product_id, quantity, warehouse_id
*   `stock_movements`: id, product_id, type (in/out), quantity, ref_document_id

### 4.4 财务与会计表
*   `accounts` (科目): id, code, name, type
*   `general_ledger` (总账): id, account_id, debit, credit, date
*   `ar_ap_records` (应收应付): id, type (AR/AP), amount, customer_vendor_id, status
*   `payment_requests` (请款单): id, amount, reason, status, approved_by

### 4.5 文件网盘表
*   `folders`: id, name, parent_id, owner_id, is_public
*   `files`: id, name, size, url, folder_id, owner_id

---

## 5. API 接口规范

系统优先使用 **Next.js Server Actions** 处理表单提交和数据变更，对于需要对外暴露或供第三方调用的接口，使用 **Route Handlers (RESTful)**。

### 5.1 统一返回结构 (REST API)
```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功",
  "errorCode": null
}
```

### 5.2 核心 Server Actions 示例
```typescript
// 销售开单并扣减库存 (需事务)
export async function createOrderAction(data: OrderInput) {
  return await prisma.$transaction(async (tx) => {
    // 1. 创建订单
    const order = await tx.order.create({ ... });
    // 2. 扣减库存 (乐观锁校验)
    await tx.inventory.update({ ... });
    // 3. 生成应收账款 (AR)
    await tx.arRecord.create({ ... });
    return order;
  });
}
```

---

## 6. 环境变量与部署

### 6.1 环境变量 (.env)
```env
# 数据库
DATABASE_URL="postgresql://user:password@host:5432/erp_db"

# 认证
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# 文件存储 (S3 兼容)
S3_ENDPOINT="https://s3.region.amazonaws.com"
S3_ACCESS_KEY="***"
S3_SECRET_KEY="***"
S3_BUCKET_NAME="erp-files"

# 邮件服务
SMTP_HOST="smtp.sendgrid.net"
SMTP_USER="apikey"
SMTP_PASS="***"
```

### 6.2 部署建议
*   **前端与 API**：推荐部署至 **Vercel**，享受全球边缘网络加速和自动化 CI/CD。
*   **数据库**：推荐使用托管 PostgreSQL 服务（如 **Supabase**, **Neon**, 或 **AWS RDS**），配置每日自动备份。
*   **文件存储**：配置 S3 Bucket 的 CORS 策略以允许前端直传，并设置私有读写权限，通过 Pre-signed URL 访问。