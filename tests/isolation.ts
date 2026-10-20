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

// Dedicated empty project created for recovery tests; never substitute a production ref.
const recoveryTestOrigin = "https://ebvwcsazotyzczrtjfol.supabase.co";

/** Test accounts alone do not isolate shared reporting: require an approved database. */
export function assertIsolatedTestEnvironment(env: Record<string, string | undefined>): void {
  if (!isLoopback(env.NEXT_PUBLIC_SUPABASE_URL) && env.NEXT_PUBLIC_SUPABASE_URL !== recoveryTestOrigin) {
    throw new Error("Mutation tests require an isolated local Supabase database or the pinned Herald Recovery Test project. Other hosted databases are prohibited.");
  }
  if (env.TEST_BASE_URL) {
    throw new Error("Mutation tests require a local application started by the test runner; TEST_BASE_URL overrides are prohibited.");
  }
}
