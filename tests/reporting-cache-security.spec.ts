import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { login, testReadersConfigured } from "./helpers";

test("processed reporting permits reader SELECT queries and denies anonymous or reader writes", async () => {
  test.skip(!testReadersConfigured, "Disposable test readers required");
  const reader = await login("A");
  expect((await reader.auth.getUser()).data.user?.id).toBeTruthy();
  const anonymous = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const entry = { cache_key: "a".repeat(64), payload: { source: "gemini", briefing: "Untrusted reader text" } };
  for (const client of [anonymous, reader]) {
    expect((await client.from("story_processing_cache").insert(entry)).error?.code).toBe("42501");
    expect((await client.from("story_processing_cache").update({ payload: entry.payload }).eq("cache_key", entry.cache_key)).error?.code).toBe("42501");
    expect((await client.from("story_processing_cache").delete().eq("cache_key", entry.cache_key)).error?.code).toBe("42501");
    expect((await client.rpc("save_processed_stories", { p_stories: [entry] })).error?.code).toBe("42501");
  }
  expect((await reader.from("story_processing_cache").select("cache_key,payload,trusted_server").limit(1)).error).toBeNull();
  expect((await anonymous.from("story_processing_cache").select("cache_key").limit(1)).error?.code).toBe("42501");
});

test("server-persisted processed reporting is visible while legacy entries stay hidden", async () => {
  test.skip(!testReadersConfigured, "Disposable test readers required");
  const reader = await login("A");
  const key = process.env.SUPABASE_REPORTING_SERVICE_KEY;
  expect(key, "Configure the isolated test project's reporting service key").toBeTruthy();
  if (!key) return;
  const server = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const trustedKey = "b".repeat(64);
  const legacyKey = "c".repeat(64);
  const payload = { source: "gemini", briefing: "Controlled server-generated cache fixture" };
  try {
    expect((await server.from("story_processing_cache").delete().in("cache_key", [trustedKey, legacyKey])).error).toBeNull();
    expect((await server.from("story_processing_cache").insert({ cache_key: legacyKey, payload, trusted_server: false })).error).toBeNull();
    expect((await server.rpc("save_processed_stories", { p_stories: [{ cache_key: trustedKey, payload }] })).error).toBeNull();
    const visible = await reader.from("story_processing_cache").select("cache_key,payload,trusted_server").in("cache_key", [trustedKey, legacyKey]);
    expect(visible.error).toBeNull();
    expect(visible.data).toEqual([{ cache_key: trustedKey, payload, trusted_server: true }]);
    // A subsequent write cannot silently change already trusted saved reporting.
    expect((await server.rpc("save_processed_stories", { p_stories: [{ cache_key: trustedKey, payload: { ...payload, briefing: "Replacement text" } }] })).error).toBeNull();
    expect((await reader.from("story_processing_cache").select("payload").eq("cache_key", trustedKey).single()).data?.payload).toEqual(payload);
  } finally {
    expect((await server.from("story_processing_cache").delete().in("cache_key", [trustedKey, legacyKey])).error).toBeNull();
  }
});
