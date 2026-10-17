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
    url: "https://example.com/science-breakthrough",
    image_url: null,
    publisher: "Science Wire",
    published_at: new Date().toISOString(),
    language: "en",
    categories: ["science", "general"],
    locale: "global",
  },
  {
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d480",
    external_id: "test-supply-2",
    title: "Technology Market Rally",
    description: "Semiconductor index surges.",
    snippet: "New chip architectures drive massive computing performance gains.",
    url: "https://example.com/tech-rally",
    image_url: null,
    publisher: "Tech Herald",
    published_at: new Date().toISOString(),
    language: "en",
    categories: ["technology", "business"],
    locale: "us",
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

    const controlledDate = "2026-10-17";

    // Clean up any previous test runs for this reader and date
    await supabaseA
      .from("editions")
      .delete()
      .eq("reader_id", user!.id)
      .eq("edition_date", controlledDate);

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
    const nextDayDate = "2026-10-18";
    const nextDayResult = await getOrCreateDailyEdition(supabaseA, user!.id, {
      controlledDate: nextDayDate,
      controlledSupply: mockSupply,
    });

    expect(nextDayResult.success).toBe(true);
    if (!nextDayResult.success) return;
    expect(nextDayResult.isNew).toBe(true);
    expect(nextDayResult.edition.edition_date).toBe(nextDayDate);
    expect(nextDayResult.edition.id).not.toBe(createdId);

    // Cleanup next day edition so test is idempotent
    await supabaseA.from("editions").delete().eq("id", nextDayResult.edition.id);
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
});
