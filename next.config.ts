import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 不把 @prisma/client 标为 external，避免 Turbopack 在独立 Node 上下文加载时拿不到 .env
  serverExternalPackages: ["bcryptjs"],
};

export default nextConfig;
