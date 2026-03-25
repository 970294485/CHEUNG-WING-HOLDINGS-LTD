/** 与 middleware（Edge）共用：请通过环境变量设置 AUTH_SECRET */
export function getAuthSecretKey(): Uint8Array {
  const s =
    process.env.AUTH_SECRET ?? "development-only-change-me-please-use-env-AUTH_SECRET-32chars";
  return new TextEncoder().encode(s);
}
