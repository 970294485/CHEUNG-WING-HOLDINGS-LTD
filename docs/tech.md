# 技術規格書 (Tech Spec)

> 本文檔詳述綜合企業管理系統 (ERP/CRM) 的技術棧選型、系統架構、數據庫設計、API 接口規範、文件存儲方案以及部署環境要求。
>
> **前置閱讀**：`docs/business_logic.md` — 業務流程、核心模塊、數據流轉。
>
> **文檔索引**：`docs/README.md`

---

## 1. 技術棧選型

### 1.1 總覽

| 層級 | 技術選型 | 版本要求 |
|------|---------|---------|
| **前端框架** | Next.js (App Router) | 14+ |
| **開發語言** | TypeScript | 5.0+ |
| **UI 組件庫** | Tailwind CSS + Shadcn UI | 最新 |
| **狀態管理** | Zustand (全局狀態) + React Query (服務端狀態) | 最新 |
| **後端 API** | Next.js Server Actions & Route Handlers | - |
| **數據庫** | PostgreSQL | 15+ |
| **ORM 框架** | Prisma 或 Drizzle ORM | 最新 |
| **身份認證** | NextAuth.js (Auth.js) | v5 |
| **文件存儲** | AWS S3 / Aliyun OSS / MinIO | - |
| **PDF 生成** | `@react-pdf/renderer` 或 Puppeteer | - |
| **Excel 生成** | `exceljs` | - |

### 1.2 選型理由
*   **Next.js (App Router)**：提供 React Server Components (RSC)，極大優化首屏加載速度，適合數據密集型的 ERP 系統；Server Actions 簡化了前後端數據交互。
*   **PostgreSQL + JSONB**：ERP 系統需要強事務 (ACID) 保證財務數據一致性；同時 JSONB 字段完美契合「產品屬性自由增加並多選」的動態需求。
*   **Shadcn UI + Tailwind**：提供高質量、可定製的無頭組件，適合快速搭建複雜的後臺管理界面。

---

## 2. 系統架構設計

系統採用 **B/S 架構**，基於 Next.js 實現前後端融合部署：

1.  **表現層 (Presentation Layer)**：
    *   使用 React Server Components 渲染靜態部分，Client Components 處理交互（如多步表單、圖表）。
2.  **業務邏輯層 (Business Logic Layer)**：
    *   通過 Server Actions 封裝核心業務邏輯（如開單、審批、核算）。
    *   使用中間件 (Middleware) 進行全局路由鑑權。
3.  **數據訪問層 (Data Access Layer)**：
    *   ORM 負責與 PostgreSQL 交互。
    *   **事務控制**：在訂單生成、庫存扣減、財務記賬等跨模塊操作時，強制使用數據庫事務。
4.  **基礎設施層 (Infrastructure Layer)**：
    *   雲數據庫、對象存儲 (S3)、郵件發送服務 (SMTP/SendGrid)。

---

## 3. 核心模塊技術實現

### 3.1 權限與安全控制 (RBAC)
*   **模型**：`User` -> `Role` -> `Permission`。
*   **實現**：
    *   中間件攔截：驗證 Session，阻擋未授權的路由訪問。
    *   Action 校驗：在 Server Action 內部再次校驗用戶是否有執行該操作的權限（如 `checkPermission('CREATE_INVOICE')`）。

### 3.2 動態產品屬性 (JSONB)
*   需求：產品屬性自由增加並可以多選 (1.8)。
*   實現：在 `Product` 表中使用 `attributes` (JSONB) 字段。
    ```json
    // JSONB 存儲示例
    {
      "材質": ["純棉", "聚酯纖維"],
      "適用季節": ["春", "秋"],
      "保修期": "1年"
    }
    ```

### 3.3 文件管理與網盤 (1.5)
*   **直傳方案**：後端生成 Pre-signed URL，前端直接將文件上傳至 S3/OSS，避免佔用應用服務器帶寬。
*   **數據庫映射**：`Files` 表記錄文件元數據（S3 Key、文件名、大小、上傳者、所屬目錄 ID）。
*   **權限隔離**：通過 `owner_id` 和 `shared_with` 字段控制個人網盤與公共數據庫的可見性。

### 3.4 財務高精度計算 (1.1, 1.2)
*   **痛點**：JavaScript 浮點數精度丟失問題（如 `0.1 + 0.2 !== 0.3`）。
*   **方案**：
    *   數據庫層面：金額字段統一使用 `DECIMAL(19,4)` 或以分為單位的 `INTEGER`。
    *   代碼層面：使用 `decimal.js` 或 `bignumber.js` 進行所有財務金額的加減乘除運算。

---

## 4. 數據庫 Schema 設計 (核心 ER 模型)

### 4.1 基礎與權限表
*   `users`: id, name, email, password_hash, role_id
*   `roles`: id, name, permissions (JSONB)
*   `company_settings`: id, name, invoice_prefix, ...

### 4.2 客戶與銷售表
*   `customers`: id, name, group, source, follow_up_status
*   `quotations` (見積): id, customer_id, total_amount, status
*   `contracts`: id, quotation_id, status
*   `invoices` (發票): id, contract_id, type (預收/正式), amount

### 4.3 產品與庫存表
*   `products`: id, sku, name, type, attributes (JSONB), price, images (JSONB)
*   `inventory`: id, product_id, quantity, warehouse_id
*   `stock_movements`: id, product_id, type (in/out), quantity, ref_document_id

### 4.4 財務與會計表
*   `accounts` (科目): id, code, name, type
*   `general_ledger` (總賬): id, account_id, debit, credit, date
*   `ar_ap_records` (應收應付): id, type (AR/AP), amount, customer_vendor_id, status
*   `payment_requests` (請款單): id, amount, reason, status, approved_by

### 4.5 文件網盤表
*   `folders`: id, name, parent_id, owner_id, is_public
*   `files`: id, name, size, url, folder_id, owner_id

---

## 5. API 接口規範

系統優先使用 **Next.js Server Actions** 處理表單提交和數據變更，對於需要對外暴露或供第三方調用的接口，使用 **Route Handlers (RESTful)**。

### 5.1 統一返回結構 (REST API)
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
// 銷售開單並扣減庫存 (需事務)
export async function createOrderAction(data: OrderInput) {
  return await prisma.$transaction(async (tx) => {
    // 1. 創建訂單
    const order = await tx.order.create({ ... });
    // 2. 扣減庫存 (樂觀鎖校驗)
    await tx.inventory.update({ ... });
    // 3. 生成應收賬款 (AR)
    await tx.arRecord.create({ ... });
    return order;
  });
}
```

---

## 6. 環境變量與部署

### 6.1 環境變量 (.env)
```env
# 數據庫
DATABASE_URL="postgresql://user:password@host:5432/erp_db"

# 認證
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# 文件存儲 (S3 兼容)
S3_ENDPOINT="https://s3.region.amazonaws.com"
S3_ACCESS_KEY="***"
S3_SECRET_KEY="***"
S3_BUCKET_NAME="erp-files"

# 郵件服務
SMTP_HOST="smtp.sendgrid.net"
SMTP_USER="apikey"
SMTP_PASS="***"
```

### 6.2 部署建議
*   **前端與 API**：推薦部署至 **Vercel**，享受全球邊緣網絡加速和自動化 CI/CD。
*   **數據庫**：推薦使用託管 PostgreSQL 服務（如 **Supabase**, **Neon**, 或 **AWS RDS**），配置每日自動備份。
*   **文件存儲**：配置 S3 Bucket 的 CORS 策略以允許前端直傳，並設置私有讀寫權限，通過 Pre-signed URL 訪問。