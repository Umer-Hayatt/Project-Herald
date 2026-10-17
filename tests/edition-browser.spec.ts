import { test, expect } from "@playwright/test";
import { login, testReadersConfigured } from "./helpers";

test.describe("Daily Edition Browser Journey", () => {
  test.skip(!testReadersConfigured, "Test readers required in .env.test.local");

  test("finishing onboarding displays preserved edition, supports skip, and preserves content across tabs", async ({
    context,
    page,
    baseURL,
  }) => {
    // 1. Authenticate reader A
    await login("A", context, baseURL!);

    // Ensure reader A preferences are complete
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

    // 2. Open /paper
    await page.goto("/paper");
    await expect(page).toHaveURL(/\/paper$/);

    // If live provider or database had no reporting, we expect the honest empty state
    // If reporting exists, we expect the full edition screen
    const emptyState = page.getByRole("heading", { name: "No fresh reporting available" });
    const isNoReporting = (await emptyState.count()) > 0;

    if (isNoReporting) {
      await expect(emptyState).toBeVisible();
      await expect(page.getByRole("link", { name: "Retry loading paper" })).toBeVisible();
      return;
    }

    // 3. Verify Edition headline and metadata chips
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator(".meta-chip").first()).toBeVisible();

    // 4. Verify Story Cards
    const storyCards = page.locator(".story-card");
    const count = await storyCards.count();
    expect(count).toBeGreaterThan(0);

    const firstStory = storyCards.first();
    await expect(firstStory.locator(".story-title")).toBeVisible();
    await expect(firstStory.locator(".story-excerpt")).toBeVisible();
    await expect(firstStory.locator(".source-link")).toBeVisible();
    await expect(firstStory.locator(".skip-btn")).toBeVisible();

    // Check source link attributes (target="_blank" and rel="noopener noreferrer")
    const sourceLink = firstStory.locator(".source-link");
    await expect(sourceLink).toHaveAttribute("target", "_blank");
    await expect(sourceLink).toHaveAttribute("rel", "noopener noreferrer");

    // 5. Test Skip action: clicking skip scrolls without removing content
    const skipBtn = firstStory.locator(".skip-btn");
    const initialStoryCount = count;
    await skipBtn.click();

    // Stories count must remain unchanged (skip never deletes content)
    expect(await storyCards.count()).toBe(initialStoryCount);

    // 6. Concurrency / Two-tab reload check: Open second tab and verify identical content
    const page2 = await context.newPage();
    await page2.goto("/paper");

    const page2Title = await page2.locator(".story-title").first().textContent();
    const page1Title = await page.locator(".story-title").first().textContent();
    expect(page2Title).toBe(page1Title);

    // 7. Verify horizontal overflow and viewport responsiveness
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBeTruthy();

    await page2.close();
  });
});
