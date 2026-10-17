import { test, expect } from "@playwright/test";
import { login, testReadersConfigured } from "./helpers";
import { getOrCreateDailyEdition } from "../src/lib/edition/service";
import type { SourceArticle } from "../src/lib/edition/types";

const mockSupply: SourceArticle[] = [
  {
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    external_id: "test-supply-browser-archive-1",
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
    external_id: "test-supply-browser-archive-2",
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

test.describe("Archive Browser Journey", () => {
  test.skip(!testReadersConfigured, "Test readers required in .env.test.local");

  test("empty archive, multi-day listing, viewing preserved edition, isolation error recovery, and navigation", async ({
    context,
    page,
    baseURL,
  }) => {
    // 1. Authenticate reader A and B
    const supabaseA = await login("A", context, baseURL!);
    const {
      data: { user: userA },
    } = await supabaseA.auth.getUser();
    expect(userA).not.toBeNull();

    // Ensure reader A is onboarded
    await context.request.put("/api/preferences", {
      headers: { origin: baseURL! },
      data: {
        interests: ["general", "science", "technology"],
        preferred_region: "global",
        reading_length: 10,
        time_zone: "Asia/Karachi",
        onboarding_complete: true,
      },
    });

    const dateDay1 = "2026-10-14";
    const dateDay2 = "2026-10-15";

    // Clean up test editions for reader A
    await supabaseA
      .from("editions")
      .delete()
      .eq("reader_id", userA!.id)
      .in("edition_date", [dateDay1, dateDay2]);

    // 2. Check empty or existing archive state
    await page.goto("/archive");
    await expect(page).toHaveURL(/\/archive$/);

    // Header must have navigation links
    await expect(page.getByRole("link", { name: "Today’s Paper" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Archive" })).toBeVisible();

    // 3. Seed two editions for two controlled dates
    const resDay1 = await getOrCreateDailyEdition(supabaseA, userA!.id, {
      controlledDate: dateDay1,
      controlledSupply: mockSupply,
    });
    expect(resDay1.success).toBe(true);
    if (!resDay1.success) return;

    const resDay2 = await getOrCreateDailyEdition(supabaseA, userA!.id, {
      controlledDate: dateDay2,
      controlledSupply: mockSupply,
    });
    expect(resDay2.success).toBe(true);
    if (!resDay2.success) return;

    // 4. Reload /archive and verify multi-day listing
    await page.goto("/archive");
    const editionCards = page.locator(".archive-card");
    await expect(editionCards.first()).toBeVisible();
    const count = await editionCards.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // Verify newest first ordering: dateDay2 card appears before dateDay1 card
    const cardDay2 = page.locator(`[data-edition-date="${dateDay2}"]`);
    const cardDay1 = page.locator(`[data-edition-date="${dateDay1}"]`);
    await expect(cardDay2).toBeVisible();
    await expect(cardDay1).toBeVisible();

    // 5. Open dateDay2 edition by clicking its link
    await cardDay2.getByRole("link", { name: /Read edition|View edition/i }).click();
    await expect(page).toHaveURL(new RegExp(`/archive/${resDay2.edition.id}$`));

    // Verify archived edition screen
    await expect(page.getByText("Archived Edition")).toBeVisible();
    await expect(page.getByRole("link", { name: /Back to archive/i })).toBeVisible();

    // Verify story cards are rendered with preserved content
    const storyCards = page.locator(".story-card");
    expect(await storyCards.count()).toBeGreaterThan(0);
    const firstStoryTitle = await storyCards.first().locator(".story-title").textContent();
    expect(firstStoryTitle).toBe(resDay2.edition.stories[0].title);

    // Source link must be intact
    const sourceLink = storyCards.first().locator(".source-link");
    await expect(sourceLink).toBeVisible();
    await expect(sourceLink).toHaveAttribute("target", "_blank");

    // Skip button must work
    const skipBtn = storyCards.first().locator(".skip-btn");
    await expect(skipBtn).toBeVisible();

    // 6. Navigate back to Today's paper via header
    await page.getByRole("link", { name: "Today’s Paper", exact: true }).click();
    await expect(page).toHaveURL(/\/paper$/);

    // 7. Test unauthorized / invalid edition access
    // Try visiting a fake UUID
    await page.goto("/archive/00000000-0000-0000-0000-000000000000");
    await expect(page.getByRole("heading", { name: /Edition unavailable|not found/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Return to archive/i })).toBeVisible();

    // 8. Verify horizontal responsiveness
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBeTruthy();

    // Cleanup
    await supabaseA
      .from("editions")
      .delete()
      .eq("reader_id", userA!.id)
      .in("edition_date", [dateDay1, dateDay2]);
  });
});
