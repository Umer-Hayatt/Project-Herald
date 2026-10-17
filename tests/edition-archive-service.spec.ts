import { test, expect } from "@playwright/test";
import { login, testReadersConfigured } from "./helpers";
import {
  getReaderArchiveEditions,
  getArchivedEditionById,
} from "../src/lib/edition/archive";
import { getOrCreateDailyEdition } from "../src/lib/edition/service";
import type { SourceArticle } from "../src/lib/edition/types";

const mockSupply: SourceArticle[] = [
  {
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    external_id: "test-supply-archive-1",
    title: "Global Clean Energy Initiative",
    description: "Nations agree on new solar investments.",
    snippet: "International summit establishes ambitious solar energy targets for 2030.",
    url: "https://example.com/clean-energy-summit",
    image_url: null,
    publisher: "Global Climate News",
    published_at: new Date().toISOString(),
    language: "en",
    categories: ["science", "general"],
    locale: "global",
  },
  {
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d480",
    external_id: "test-supply-archive-2",
    title: "Breakthrough in Autonomous Robotics",
    description: "New models demonstrate adaptive learning.",
    snippet: "Robotics researchers unveil neural controllers capable of rapid adaptation.",
    url: "https://example.com/robotics-breakthrough",
    image_url: null,
    publisher: "Tech Dispatch",
    published_at: new Date().toISOString(),
    language: "en",
    categories: ["technology"],
    locale: "us",
  },
];

test.describe("Archive Service Integration", () => {
  test.skip(!testReadersConfigured, "Test readers required in .env.test.local");

  test("lists completed editions newest-first, retrieves identical preserved content, and enforces reader isolation", async () => {
    const supabaseA = await login("A");
    const supabaseB = await login("B");

    const {
      data: { user: userA },
    } = await supabaseA.auth.getUser();
    const {
      data: { user: userB },
    } = await supabaseB.auth.getUser();

    expect(userA).not.toBeNull();
    expect(userB).not.toBeNull();

    // 1. Ensure reader A preferences are set
    await supabaseA.from("reader_preferences").upsert({
      reader_id: userA!.id,
      interests: ["science", "technology"],
      preferred_region: "global",
      reading_length: 10,
      time_zone: "Asia/Karachi",
      onboarding_complete: true,
    });

    const dateDay1 = "2026-10-15";
    const dateDay2 = "2026-10-16";

    // Clean up test editions for dateDay1 and dateDay2
    await supabaseA
      .from("editions")
      .delete()
      .eq("reader_id", userA!.id)
      .in("edition_date", [dateDay1, dateDay2]);

    // Create day 1 edition
    const resDay1 = await getOrCreateDailyEdition(supabaseA, userA!.id, {
      controlledDate: dateDay1,
      controlledSupply: mockSupply,
    });
    expect(resDay1.success).toBe(true);
    if (!resDay1.success) return;

    // Create day 2 edition
    const resDay2 = await getOrCreateDailyEdition(supabaseA, userA!.id, {
      controlledDate: dateDay2,
      controlledSupply: mockSupply,
    });
    expect(resDay2.success).toBe(true);
    if (!resDay2.success) return;

    // Insert an incomplete/generating edition directly to verify it is filtered out
    const { data: generatingEdition } = await supabaseA
      .from("editions")
      .insert({
        reader_id: userA!.id,
        edition_date: "2026-10-14",
        time_zone: "Asia/Karachi",
        reading_length: 10,
        status: "generating",
      })
      .select()
      .single();

    // 2. Query archive list for reader A
    const archiveList = await getReaderArchiveEditions(supabaseA, userA!.id);
    expect(archiveList.length).toBeGreaterThanOrEqual(2);

    // Verify ordering: newest first (2026-10-16 before 2026-10-15)
    const day2Index = archiveList.findIndex((e) => e.edition_date === dateDay2);
    const day1Index = archiveList.findIndex((e) => e.edition_date === dateDay1);
    expect(day2Index).toBeGreaterThanOrEqual(0);
    expect(day1Index).toBeGreaterThanOrEqual(0);
    expect(day2Index).toBeLessThan(day1Index);

    // Verify incomplete/generating edition is not included
    if (generatingEdition) {
      const generatingIndex = archiveList.findIndex((e) => e.id === generatingEdition.id);
      expect(generatingIndex).toBe(-1);
    }

    // Verify story count and metadata
    const day2Item = archiveList[day2Index];
    expect(day2Item.id).toBe(resDay2.edition.id);
    expect(day2Item.story_count).toBe(resDay2.edition.stories.length);
    expect(day2Item.estimated_reading_minutes).toBe(resDay2.edition.estimated_reading_minutes);

    // 3. Fetch archived edition detail by ID
    const detailDay2 = await getArchivedEditionById(supabaseA, userA!.id, resDay2.edition.id);
    expect(detailDay2).not.toBeNull();
    expect(detailDay2!.id).toBe(resDay2.edition.id);
    expect(detailDay2!.edition_date).toBe(dateDay2);
    expect(detailDay2!.stories.length).toBe(resDay2.edition.stories.length);
    expect(detailDay2!.stories[0].title).toBe(resDay2.edition.stories[0].title);
    expect(detailDay2!.stories[0].excerpt).toBe(resDay2.edition.stories[0].excerpt);
    expect(detailDay2!.stories[0].source_url).toBe(resDay2.edition.stories[0].source_url);

    // 4. Enforce reader isolation: Reader B cannot fetch Reader A's archived edition
    const unauthorizedAttempt = await getArchivedEditionById(
      supabaseB,
      userB!.id,
      resDay2.edition.id,
    );
    expect(unauthorizedAttempt).toBeNull();

    // Reader B archive list does NOT contain Reader A's editions
    const readerBArchive = await getReaderArchiveEditions(supabaseB, userB!.id);
    const readerAEditionsInB = readerBArchive.filter((e) => e.id === resDay2.edition.id);
    expect(readerAEditionsInB).toHaveLength(0);

    // 5. Cleanup test artifacts
    if (generatingEdition) {
      await supabaseA.from("editions").delete().eq("id", generatingEdition.id);
    }
    await supabaseA
      .from("editions")
      .delete()
      .eq("reader_id", userA!.id)
      .in("edition_date", [dateDay1, dateDay2]);
  });
});
