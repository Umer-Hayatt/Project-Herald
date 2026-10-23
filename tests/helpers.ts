import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { expect, type BrowserContext } from "@playwright/test";
import { assertIsolatedTestEnvironment } from "./isolation";
export const testReadersConfigured = Boolean(
  process.env.TEST_READER_A_EMAIL && process.env.TEST_READER_B_EMAIL,
);
export const draft = {
  interests: [],
  preferred_region: "global",
  reading_length: 10,
  time_zone: "Asia/Karachi",
  onboarding_complete: false,
};
export async function login(
  label: "A" | "B",
  context?: BrowserContext,
  baseURL?: string,
) {
  assertIsolatedTestEnvironment(process.env);
  const values = new Map<string, string>();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  const client = context
    ? createServerClient(url, key, {
        cookies: {
          getAll: () => [],
          setAll: (cookies) => {
            cookies.forEach(({ name, value }) => values.set(name, value));
          },
        },
      })
    : createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
  const { error } = await client.auth.signInWithPassword({
    email: process.env["TEST_READER_" + label + "_EMAIL"]!,
    password: process.env["TEST_READER_" + label + "_PASSWORD"]!,
  });
  expect(
    error,
    "Disposable reader must authenticate against real Supabase",
  ).toBeNull();
  if (context)
    await context.addCookies([{ name: "herald_adult_confirmation", value: "18-plus-v1", url: baseURL!, httpOnly: true, sameSite: "Lax" }]);
  if (context)
    await context.addCookies(
      [...values].map(([name, value]) => ({
        name,
        value,
        url: baseURL!,
        sameSite: "Lax",
      })),
    );
  return client;
}
