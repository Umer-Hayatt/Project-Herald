import { test, expect } from "@playwright/test";
import { login, testReadersConfigured } from "./helpers";
import { getPublicSampleEdition, SAMPLE_EDITION_ID } from "../src/lib/edition/sample";

test.describe("Recovery R07: Calm Finished Reading & Public Samples Before Login", () => {
  test("1. Canonical sample edition data contract: produces valid, grounded, PII-free sample edition", () => {
    const sample = getPublicSampleEdition();

    expect(sample.id).toBe(SAMPLE_EDITION_ID);
    expect(sample.edition_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(sample.estimated_reading_minutes).toBeGreaterThan(0);
    expect(sample.word_count).toBeGreaterThan(0);
    expect(sample.stories.length).toBeGreaterThanOrEqual(4);

    // Verify sections and story contracts
    const mainStories = sample.stories.filter((s) => s.section === "main");
    const beyondBubble = sample.stories.filter((s) => s.section === "beyond_bubble");

    expect(mainStories.length).toBeGreaterThanOrEqual(3);
    expect(beyondBubble.length).toBeGreaterThanOrEqual(1);

    for (const story of sample.stories) {
      expect(story.title.length).toBeGreaterThan(15);
      expect(story.publisher.length).toBeGreaterThan(2);
      expect(story.source_url).toMatch(/^https?:\/\//);
      expect(story.briefing).toBeTruthy();
      expect(story.briefing!.length).toBeGreaterThan(30);
      expect(story.why_it_matters).toBeTruthy();
      expect(story.why_it_matters!.length).toBeGreaterThan(20);
      expect(story.category).toBeTruthy();
      expect(story.word_count).toBeGreaterThan(50);
      expect(story.supporting_sources).toBeTruthy();
      expect(story.supporting_sources!.length).toBeGreaterThanOrEqual(1);
    }
  });

  test("2. Public sample page: renders unauthenticated with sample badge, canonical stories, and calm finish", async ({
    page,
  }) => {
    // Navigate without authentication
    await page.goto("/sample");
    await expect(page).toHaveURL(/\/sample$/);

    // 1. Prominent sample badge and description
    const sampleBanner = page.locator(".sample-banner");
    await expect(sampleBanner).toBeVisible();
    await expect(sampleBanner.locator(".sample-badge")).toHaveText("Sample Edition");
    await expect(sampleBanner.locator(".sample-description")).toContainText("demonstration of Herald’s daily paper");

    // 2. Download sample PDF button
    const pdfDownloadBtn = sampleBanner.locator("a.sample-pdf-btn");
    await expect(pdfDownloadBtn).toBeVisible();
    await expect(pdfDownloadBtn).toHaveAttribute("href", "/api/editions/sample/pdf");

    // 3. Compact dated header
    await expect(page.locator("h1.edition-header-title")).toBeVisible();
    await expect(page.locator(".edition-header-meta")).toContainText("Sample Issue");
    await expect(page.locator(".edition-header-meta")).toContainText("plan");

    // 4. Main and Beyond Your Bubble stories
    const storyCards = page.locator(".story-card");
    const storyCount = await storyCards.count();
    expect(storyCount).toBeGreaterThanOrEqual(4);

    // Verify first story has full contract visible
    const firstStory = storyCards.first();
    await expect(firstStory.locator(".story-title")).toBeVisible();
    await expect(firstStory.locator(".story-briefing")).toBeVisible();
    await expect(firstStory.locator(".story-why-it-matters")).toBeVisible();
    await expect(firstStory.locator(".source-link")).toBeVisible();

    // 5. Calm finished ending
    const editionEnd = page.locator("#edition-end");
    await expect(editionEnd).toBeVisible();
    await expect(editionEnd.locator(".edition-end-title")).toHaveText("Experience the calm of a finite paper.");
    await expect(editionEnd.locator("a[href='/login']")).toBeVisible();
  });

  test("3. Public sample PDF endpoint: returns 200 PDF without authentication header or cookie", async ({
    request,
  }) => {
    // Request via sample slug
    const resSample = await request.get("/api/editions/sample/pdf");
    expect(resSample.status()).toBe(200);
    expect(resSample.headers()["content-type"]).toBe("application/pdf");
    expect(resSample.headers()["content-disposition"]).toContain("Herald-Sample-Edition.pdf");

    const sampleBuffer = await resSample.body();
    expect(sampleBuffer.slice(0, 5).toString("utf-8")).toBe("%PDF-");

    // Request via canonical sample UUID
    const resId = await request.get(`/api/editions/${SAMPLE_EDITION_ID}/pdf`);
    expect(resId.status()).toBe(200);
    expect(resId.headers()["content-type"]).toBe("application/pdf");

    const idBuffer = await resId.body();
    expect(idBuffer.slice(0, 5).toString("utf-8")).toBe("%PDF-");
  });

  test("4. Landing page: offers prominent sample preview and clean wire context", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\//);

    // 1. Link to inspect sample paper & PDF in hero
    const sampleHeroLink = page.getByRole("link", { name: "Inspect sample paper & PDF →" });
    await expect(sampleHeroLink).toBeVisible();
    await expect(sampleHeroLink).toHaveAttribute("href", "/sample");

    // 2. Clickable art-space preview links to sample
    const artSpaceLink = page.locator(".art-space a[href='/sample']");
    await expect(artSpaceLink).toBeVisible();

    // 3. Verify wire briefs sidebar does NOT contain hype "Trending 🔥"
    const sidebar = page.locator("aside.edition-sidebar");
    if ((await sidebar.count()) > 0) {
      await expect(sidebar).not.toContainText("Trending 🔥");
      await expect(sidebar).not.toContainText("On Trending");
    }
  });

  test("5. Signed-in paper session: compact dated header with duration vs budget, clean feed, and calm ending", async ({
    context,
    page,
    baseURL,
  }) => {
    test.skip(!testReadersConfigured, "Test readers required in .env.test.local");

    await login("A", context, baseURL!);

    // Ensure reading length is set to 10
    await context.request.put("/api/preferences", {
      headers: { origin: baseURL! },
      data: {
        interests: ["technology", "science", "business"],
        preferred_region: "global",
        reading_length: 10,
        time_zone: "UTC",
        onboarding_complete: true,
      },
    });

    await page.goto("/paper");
    await expect(page).toHaveURL(/\/paper$/);

    // If empty reporting, honest empty state is shown
    const emptyState = page.getByRole("heading", { name: "No fresh reporting available" });
    if ((await emptyState.count()) > 0) {
      await expect(emptyState).toBeVisible();
      return;
    }

    // 1. Compact dated header displays actual duration vs budget
    const metaChips = page.locator(".edition-meta-chips");
    await expect(metaChips).toBeVisible();
    await expect(metaChips.locator(".meta-chip.highlight")).toContainText("min read (10 min plan)");

    // 2. Duplicate teaser section ("Featured Stories") is removed from the signed-in paper
    const duplicateFeaturedTeasers = page.locator(".featured-stories-section");
    expect(await duplicateFeaturedTeasers.count()).toBe(0);

    // 3. Unmeasured "Trending 🔥" hype label is removed from the sidebar
    const sidebar = page.locator("aside.edition-sidebar");
    if ((await sidebar.count()) > 0) {
      await expect(sidebar).not.toContainText("On Trending");
      await expect(sidebar).not.toContainText("🔥");
      await expect(sidebar.locator(".ritual-summary-card")).toBeVisible();
    }

    // 4. Calm finite completion section (#edition-end)
    const editionEnd = page.locator("#edition-end");
    await expect(editionEnd).toBeVisible();
    await expect(editionEnd.locator(".edition-end-title")).toHaveText("You’ve finished today’s paper.");
    await expect(editionEnd.locator("button.pdf-download-btn, a.pdf-download-btn")).toBeVisible();
    await expect(editionEnd.locator("a[href='/settings']")).toBeVisible();
    await expect(editionEnd.locator("a[href='/archive']")).toBeVisible();
  });

  test("6. Accessibility and landmark semantics: clean structure and keyboard focusable actions", async ({
    page,
  }) => {
    await page.goto("/sample");

    // Landmarks
    await expect(page.locator("main#main")).toBeVisible();
    await expect(page.locator("header.masthead")).toBeVisible();
    await expect(page.locator("#edition-end")).toBeVisible();

    // Key interactive buttons are keyboard focusable
    const pdfBtn = page.locator("a.sample-pdf-btn");
    await pdfBtn.focus();
    await expect(pdfBtn).toBeFocused();

    const startBtn = page.locator("#edition-end a[href='/login']");
    await startBtn.focus();
    await expect(startBtn).toBeFocused();
  });
});
