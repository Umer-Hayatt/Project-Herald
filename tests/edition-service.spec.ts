import { test, expect } from "@playwright/test";
import { login, testReadersConfigured } from "./helpers";
import { getOrCreateDailyEdition } from "../src/lib/edition/service";
import type { SourceArticle } from "../src/lib/edition/types";

const mockSupply: SourceArticle[] = [
  {
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    external_id: "test-supply-1",
    title: "Global Scientific Discovery",
    description: "Breakthrough in energy efficiency.",
    snippet: "Scientists discover ambient superconducting compound.",
    url: "https://publisher.org/science-breakthrough",
    image_url: null,
    publisher: "Science Wire",
    published_at: new Date().toISOString(),
    language: "en",
    categories: ["science", "general"],
    locale: "global",
    raw_data: { provider: "thenewsapi", output_use: "commercial" },
  },
  {
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d480",
    external_id: "test-supply-2",
    title: "Technology Market Rally",
    description: "Semiconductor index surges.",
    snippet: "New chip architectures drive massive computing performance gains.",
    url: "https://publisher.org/tech-rally",
    image_url: null,
    publisher: "Tech Herald",
    published_at: new Date().toISOString(),
    language: "en",
    categories: ["technology", "business"],
    locale: "us",
    raw_data: { provider: "thenewsapi", output_use: "commercial" },
  },
];

test.describe("Edition Service Integration", () => {
  test.skip(!testReadersConfigured, "Test readers required in .env.test.local");

  test("generates and preserves daily edition for reader", async () => {
    const supabaseA = await login("A");
    const { data: { user } } = await supabaseA.auth.getUser();
    expect(user).not.toBeNull();

    // Ensure reader A is onboarded
    await supabaseA.from("reader_preferences").upsert({
      reader_id: user!.id,
      interests: ["science", "technology"],
      preferred_region: "global",
      reading_length: 10,
      time_zone: "Asia/Karachi",
      onboarding_complete: true,
    });

    const { data: latestRows } = await supabaseA.from("editions").select("edition_date")
      .eq("reader_id", user!.id).order("edition_date", { ascending: false }).limit(1);
    const latestDate = latestRows?.[0]?.edition_date || "2026-10-16";
    const controlledDate = new Date(Date.parse(`${latestDate}T00:00:00Z`) + 86_400_000)
      .toISOString().slice(0, 10);
    const nextDayDate = new Date(Date.parse(`${controlledDate}T00:00:00Z`) + 86_400_000)
      .toISOString().slice(0, 10);

    // Clean up any previous test runs for this reader and date
    await supabaseA
      .from("editions")
      .delete()
      .eq("reader_id", user!.id)
      .in("edition_date", [controlledDate, nextDayDate]);

    // 1. First visit creates an edition
    const firstResult = await getOrCreateDailyEdition(supabaseA, user!.id, {
      controlledDate,
      controlledSupply: mockSupply,
    });

    expect(firstResult.success).toBe(true);
    if (!firstResult.success) return;

    expect(firstResult.isNew).toBe(true);
    expect(firstResult.edition.edition_date).toBe(controlledDate);
    expect(firstResult.edition.stories.length).toBeGreaterThan(0);
    expect(firstResult.edition.stories[0].title).toBeDefined();

    const createdId = firstResult.edition.id;

    // 2. Second visit on the same day returns the IDENTICAL preserved snapshot
    const secondResult = await getOrCreateDailyEdition(supabaseA, user!.id, {
      controlledDate,
      controlledSupply: mockSupply,
    });

    expect(secondResult.success).toBe(true);
    if (!secondResult.success) return;

    expect(secondResult.isNew).toBe(false);
    expect(secondResult.edition.id).toBe(createdId);
    expect(secondResult.edition.stories.length).toBe(firstResult.edition.stories.length);
    expect(secondResult.edition.stories[0].id).toBe(firstResult.edition.stories[0].id);

    // 3. Concurrency check: Parallel requests coalesce to the same edition
    const [concurrent1, concurrent2] = await Promise.all([
      getOrCreateDailyEdition(supabaseA, user!.id, { controlledDate, controlledSupply: mockSupply }),
      getOrCreateDailyEdition(supabaseA, user!.id, { controlledDate, controlledSupply: mockSupply }),
    ]);

    expect(concurrent1.success).toBe(true);
    expect(concurrent2.success).toBe(true);
    if (concurrent1.success && concurrent2.success) {
      expect(concurrent1.edition.id).toBe(createdId);
      expect(concurrent2.edition.id).toBe(createdId);
    }

    // 4. Moving to the next day creates a new edition
    const nextDayResult = await getOrCreateDailyEdition(supabaseA, user!.id, {
      controlledDate: nextDayDate,
      controlledSupply: mockSupply,
    });

    expect(nextDayResult.success).toBe(true);
    if (!nextDayResult.success) return;
    expect(nextDayResult.isNew).toBe(true);
    expect(nextDayResult.edition.edition_date).toBe(nextDayDate);
    expect(nextDayResult.edition.id).not.toBe(createdId);

    // Cleanup both editions so the same integration journey can run repeatedly.
    await supabaseA.from("editions").delete().eq("reader_id", user!.id)
      .in("edition_date", [controlledDate, nextDayDate]);
  });

  test("enforces reader isolation: reader B cannot see reader A's edition", async () => {
    const supabaseA = await login("A");
    const supabaseB = await login("B");

    const { data: { user: userA } } = await supabaseA.auth.getUser();
    expect(userA).not.toBeNull();

    // Query reader A's editions as reader B directly through RLS
    const { data: readerBViewOfA } = await supabaseB
      .from("editions")
      .select("*")
      .eq("reader_id", userA!.id);

    expect(readerBViewOfA).toHaveLength(0);
  });

  test("offers the latest preserved Edition under its actual date when fresh reporting is unavailable", async () => {
    const supabase = await login("A");
    const { data: { user } } = await supabase.auth.getUser();
    expect(user).not.toBeNull();

    await supabase.from("reader_preferences").upsert({
      reader_id: user!.id,
      interests: ["science", "technology"],
      preferred_region: "global",
      reading_length: 10,
      time_zone: "Asia/Karachi",
      onboarding_complete: true,
    });

    const { data: latestRows } = await supabase.from("editions").select("edition_date")
      .eq("reader_id", user!.id).order("edition_date", { ascending: false }).limit(1);
    const latestDate = latestRows?.[0]?.edition_date || "2000-01-01";
    const savedDate = new Date(Date.parse(`${latestDate}T00:00:00Z`) + 86_400_000)
      .toISOString().slice(0, 10);
    const unavailableDate = new Date(Date.parse(`${savedDate}T00:00:00Z`) + 86_400_000)
      .toISOString().slice(0, 10);
    await supabase.from("editions").delete().eq("reader_id", user!.id)
      .in("edition_date", [savedDate, unavailableDate]);

    const saved = await getOrCreateDailyEdition(supabase, user!.id, {
      controlledDate: savedDate,
      controlledSupply: mockSupply,
    });
    expect(saved.success).toBe(true);
    if (!saved.success) return;

    const fallback = await getOrCreateDailyEdition(supabase, user!.id, {
      controlledDate: unavailableDate,
      controlledSupply: [],
    });

    expect(fallback.success, JSON.stringify(fallback)).toBe(true);
    if (fallback.success) {
      expect(fallback.isFallback).toBe(true);
      expect(fallback.edition.id).toBe(saved.edition.id);
      expect(fallback.edition.edition_date).toBe(savedDate);
      expect(fallback.edition.stories[0].title).toBe(saved.edition.stories[0].title);
    }

    const recovered = await getOrCreateDailyEdition(supabase, user!.id, {
      controlledDate: unavailableDate,
      controlledSupply: mockSupply,
    });
    expect(recovered.success, JSON.stringify(recovered)).toBe(true);
    if (!recovered.success) return;
    expect(recovered.isNew).toBe(true);
    expect(recovered.edition.edition_date).toBe(unavailableDate);
    expect(recovered.edition.id).not.toBe(saved.edition.id);

    const repeatedRecovery = await getOrCreateDailyEdition(supabase, user!.id, {
      controlledDate: unavailableDate,
      controlledSupply: mockSupply,
    });
    expect(repeatedRecovery.success, JSON.stringify(repeatedRecovery)).toBe(true);
    if (repeatedRecovery.success) {
      expect(repeatedRecovery.isNew).toBe(false);
      expect(repeatedRecovery.edition.id).toBe(recovered.edition.id);
    }

    const stillPreserved = await getOrCreateDailyEdition(supabase, user!.id, {
      controlledDate: savedDate,
      controlledSupply: [],
    });
    expect(stillPreserved.success).toBe(true);
    if (stillPreserved.success) {
      expect(stillPreserved.edition.id).toBe(saved.edition.id);
      expect(stillPreserved.edition.edition_date).toBe(savedDate);
      expect(stillPreserved.edition.stories[0].title).toBe(saved.edition.stories[0].title);
    }

    await supabase.from("editions").delete().eq("reader_id", user!.id)
      .in("edition_date", [savedDate, unavailableDate]);
  });

  test("leaves an unavailable day unsaved when there is no saved Edition to offer", async () => {
    const supabase = await login("B");
    const { data: { user } } = await supabase.auth.getUser();
    expect(user).not.toBeNull();

    const { data: priorEditions } = await supabase.from("editions")
      .select("id").eq("reader_id", user!.id).limit(1);
    test.skip(Boolean(priorEditions?.length), "A clean disposable reader is required for the no-saved-Edition case");

    await supabase.from("reader_preferences").upsert({
      reader_id: user!.id,
      interests: ["science"],
      preferred_region: "global",
      reading_length: 10,
      time_zone: "Asia/Karachi",
      onboarding_complete: true,
    });
    const unavailableDate = "2100-10-17";
    await supabase.from("editions").delete().eq("reader_id", user!.id)
      .eq("edition_date", unavailableDate);

    const result = await getOrCreateDailyEdition(supabase, user!.id, {
      controlledDate: unavailableDate,
      controlledSupply: [],
    });

    expect(result).toEqual({ success: false, error: "NO_REPORTING" });
    const { data: editions } = await supabase.from("editions").select("id")
      .eq("reader_id", user!.id).eq("edition_date", unavailableDate);
    expect(editions).toHaveLength(0);
  });
});
