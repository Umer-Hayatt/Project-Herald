function isLoopback(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) &&
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  } catch {
    return false;
  }
}

/** Test accounts do not isolate shared reporting. Only local infrastructure does. */
export function assertIsolatedTestEnvironment(env: Record<string, string | undefined>): void {
  if (!isLoopback(env.NEXT_PUBLIC_SUPABASE_URL)) {
    throw new Error("Mutation tests require an isolated local Supabase database. Hosted databases are prohibited.");
  }
  if (env.TEST_BASE_URL) {
    throw new Error("Mutation tests require a local application started by the test runner; TEST_BASE_URL overrides are prohibited.");
  }
}
