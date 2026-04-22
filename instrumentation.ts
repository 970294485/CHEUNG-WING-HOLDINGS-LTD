export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { loadEnvConfig } = await import("@next/env");
    loadEnvConfig(process.cwd());
  }
}
