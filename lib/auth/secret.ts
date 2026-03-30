/** 與 middleware（Edge）共用：請通過環境變量設置 AUTH_SECRET */
export function getAuthSecretKey(): Uint8Array {
  const s =
    process.env.AUTH_SECRET ?? "development-only-change-me-please-use-env-AUTH_SECRET-32chars";
  return new TextEncoder().encode(s);
}
