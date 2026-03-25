# 综合企业管理系统 (ERP/CRM)

本项目是一个基于 Next.js 开发的现代化综合企业管理系统（ERP/CRM），旨在实现企业的**业财一体化**、**数据互通**、**权限严控**与**流程自动化**。

## 🌟 核心功能模块

系统涵盖了企业日常运营的完整生命周期：

- **基础与权限管理 (RBAC)**：灵活的公司资料配置与细粒度的角色权限控制。
- **产品与库存管理**：支持动态多属性的产品档案，以及防超卖、带成本核算的实时库存流转。
- **客户与销售管理**：实现从客户跟进、报价(見積)、合同签订到预收发票的“线索到现金”完整业务闭环。
- **财务与会计管理**：规范资金流出入，支持请款审批、预收款对接、应收应付(AR/AP)及自动生成总账与财务报表(P&L)。
- **文件与网盘系统**：内置企业级个人网盘与公共知识库，支持业务单据（PDF/Excel）的一键导出。
- **数据报表与分析**：提供多维度的财务、销售、客户及库存数据可视化看板，辅助管理层决策。

## 🛠 技术栈选型

- **前端/全栈框架**：Next.js 14+ (App Router) + TypeScript
- **UI 组件**：Tailwind CSS + Shadcn UI
- **数据库**：PostgreSQL (利用 JSONB 实现动态属性) + Prisma / Drizzle ORM
- **状态与认证**：Zustand + React Query + NextAuth.js (v5)
- **文件存储**：AWS S3 / Aliyun OSS / MinIO

## 📚 详细文档

更多系统设计与开发细节，请参阅 `docs` 目录下的相关文档：

- [业务逻辑文档 (Business Logic)](./docs/business_logic.md) - 核心业务流程、工作流与权限审批
- [技术规格书 (Tech Spec)](./docs/tech.md) - 架构设计、数据库 Schema 与 API 规范
- [开发阶段拆解 (Development Phase)](./docs/development_phase.md) - 项目开发计划与任务拆解

## 🚀 快速体验 (Demo)

- **登录账号 (Email)**: `demo@tvp.local`
- **登录密码 (Password)**: `demo123`
