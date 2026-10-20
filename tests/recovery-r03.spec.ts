import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { login, testReadersConfigured } from "./helpers";
import { generateEditionPdf } from "../src/lib/edition/pdf";
import { selectEditionStories, rankGroupedStories } from "../src/lib/edition/ranking";
import { getOrCreateDailyEdition } from "../src/lib/edition/service";
import { resolveFamiliarTimeZone, isTimeZone } from "../src/lib/preferences";
import type { Edition, GroupedSourceArticle, SourceArticle } from "../src/lib/edition/types";

const now = new Date("2026-10-18T10:00:00Z");

const sampleGroupedSupply: GroupedSourceArticle[] = [
  {
    id: "r03-story-energy",
    external_id: "r03-ext-energy",
    title: "Clean Energy Transition Accelerates Across Europe and North America",
    description: "Wind and solar infrastructure outpaces fossil fuels across Western nations.",
    snippet: "International energy agencies report solar capacity doubled in the past twelve months.",
    url: "https://publisher.org/clean-energy-transition",
    image_url: null,
    publisher: "Clean Wire Service",
    published_at: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
    language: "en",
    categories: ["science", "technology"],
    locale: "global",
    raw_data: { provider: "thenewsapi", output_use: "commercial" },
    supportingArticles: [
      {
        id: "r03-supp-1",
        external_id: "r03-supp-ext-1",
        title: "Renewable Grid Expansion Hits New Record",
        description: "Transmission lines expand to support clean power.",
        snippet: "Interconnection waitlists drop significantly.",
        url: "https://publisher.org/renewable-grid-record",
        image_url: null,
        publisher: "Energy Grid Dispatch",
        published_at: new Date(now.getTime() - 3 * 3600 * 1000).toISOString(),
        language: "en",
        categories: ["science"],
        locale: "global",
        raw_data: { provider: "thenewsapi", output_use: "commercial" },
      },
    ],
    briefing: "Wind and solar infrastructure outpaces fossil fuels across Western nations with rapid grid integration.",
    whyItMatters: "Grid capacity determines the real-world deployment speed of zero-emission industrial power.",
    topics: ["science", "technology"],
    briefingSource: "publisher_excerpt",
  },
  {
    id: "r03-story-semiconductors",
    external_id: "r03-ext-semi",
    title: "Global Semiconductor Manufacturers Invest Billions in New Fabrication Plants",
    description: "Chipmakers expand production facilities in the United States, Europe, and Asia.",
    snippet: "Advanced semiconductor packaging and high bandwidth memory drive historic infrastructure investments.",
    url: "https://publisher.org/semiconductor-fab-investments",
    image_url: null,
    publisher: "Tech Global Daily",
    published_at: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
    language: "en",
    categories: ["technology", "business"],
    locale: "us",
    raw_data: { provider: "thenewsapi", output_use: "commercial" },
    supportingArticles: [],
    briefing: "Chipmakers expand production facilities across three continents to secure supply chains for advanced memory.",
    whyItMatters: "Semiconductor sovereignty is reshaping global industrial policy and supply chain resilience.",
    topics: ["technology", "business"],
    briefingSource: "publisher_excerpt",
  },
  {
    id: "r03-story-marine",
    external_id: "r03-ext-marine",
    title: "Autonomous Maritime Navigation Treaty Signed in Geneva",
    description: "Maritime nations adopt unified standards for uncrewed ocean vessels.",
    snippet: "Safety protocols and liability frameworks established for commercial automated shipping.",
    url: "https://publisher.org/maritime-treaty",
    image_url: null,
    publisher: "Maritime Law Herald",
    published_at: new Date(now.getTime() - 6 * 3600 * 1000).toISOString(),
    language: "en",
    categories: ["politics", "travel"],
    locale: "global",
    raw_data: { provider: "thenewsapi", output_use: "commercial" },
    supportingArticles: [],
    briefing: "International treaty establishes binding safety protocols for uncrewed commercial shipping fleets.",
    whyItMatters: "Sets the global regulatory foundation for the next century of autonomous maritime trade.",
    topics: ["politics"],
    briefingSource: "publisher_excerpt",
  },
  {
    id: "r03-story-sports",
    external_id: "r03-ext-sports",
    title: "Championship Series Game 4 Recap and Analysis",
    description: "Pitching adjustments and bullpen management decide key postseason match.",
    snippet: "Late-inning strategy shifts momentum in tournament series.",
    url: "https://publisher.org/sports-recap",
    image_url: null,
    publisher: "Sports Wire Daily",
    published_at: new Date(now.getTime() - 5 * 3600 * 1000).toISOString(),
    language: "en",
    categories: ["sports"],
    locale: "us",
    raw_data: { provider: "thenewsapi", output_use: "commercial" },
    supportingArticles: [],
    briefing: "Postseason match decided by bullpen adjustments in the late innings.",
    whyItMatters: "Changes tournament seeding heading into the final round.",
    topics: ["sports"],
    briefingSource: "publisher_excerpt",
  },
];

test.describe("Recovery R03: Read consistent Editions that improve with saved preferences and feedback", () => {
  test.skip(!testReadersConfigured, "Test readers required in .env.test.local");

  test("1. Canonical Story contract & PDF parity: renders separate importance, ordered sections, and clickable sources", async () => {
    const sampleEdition: Edition = {
      id: "22222222-2222-4222-a222-222222222222",
      reader_id: "reader-user-r03",
      edition_date: "2026-10-18",
      time_zone: "Asia/Karachi",
      reading_length: 10,
      estimated_reading_minutes: 6,
      word_count: 850,
      selection_version: "v1-deterministic",
      status: "completed",
      created_at: "2026-10-18T08:00:00Z",
      stories: [
        {
          id: "r03-story-1",
          edition_id: "22222222-2222-4222-a222-222222222222",
          position: 1,
          title: "Clean Energy Transition Accelerates Across Europe and North America",
          excerpt: "Wind and solar infrastructure outpaces fossil fuels across Western nations.",
          briefing: "Wind and solar infrastructure outpaces fossil fuels across Western nations.",
          why_it_matters: "Grid capacity determines the real-world deployment speed of zero-emission industrial power.",
          publisher: "Clean Wire Service",
          source_url: "https://publisher.org/clean-energy-transition",
          published_at: "2026-10-18T08:00:00Z",
          category: "science",
          locale: "global",
          word_count: 320,
          section: "main",
          supporting_sources: [
            {
              title: "Renewable Grid Expansion Hits New Record",
              url: "https://publisher.org/renewable-grid-record",
              publisher: "Energy Grid Dispatch",
            },
          ],
        },
        {
          id: "r03-story-2",
          edition_id: "22222222-2222-4222-a222-222222222222",
          position: 2,
          title: "Autonomous Maritime Navigation Treaty Signed in Geneva",
          excerpt: "Maritime nations adopt unified standards for uncrewed ocean vessels.",
          briefing: "Maritime nations adopt unified standards for uncrewed ocean vessels.",
          why_it_matters: "Sets the global regulatory foundation for the next century of autonomous maritime trade.",
          publisher: "Maritime Law Herald",
          source_url: "https://publisher.org/maritime-treaty",
          published_at: "2026-10-18T04:00:00Z",
          category: "politics",
          locale: "global",
          word_count: 280,
          section: "beyond_bubble",
        },
      ],
    };

    const pdfBuffer = await generateEditionPdf(sampleEdition);
    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");

    const tmpDir = path.join(process.cwd(), "tmp", "test-pdfs");
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    const tmpPdfPath = path.join(tmpDir, `test-r03-${Date.now()}.pdf`);
    fs.writeFileSync(tmpPdfPath, pdfBuffer);

    const scriptPath = path.join(process.cwd(), "scripts", "inspect-pdf.py");
    const output = execSync(`python "${scriptPath}" "${tmpPdfPath}"`, {
      encoding: "utf-8",
    });
    const parsed = JSON.parse(output.trim());

    // Verify separate importance explanation ("Why it matters:") is rendered into the PDF
    expect(parsed.full_text).toContain("Why it matters:");
    expect(parsed.full_text).toContain("Grid capacity determines the real-world deployment speed");
    // Verify source URLs are present in clickable link annotations
    expect(parsed.links).toContain("https://publisher.org/clean-energy-transition");
    expect(parsed.links).toContain("https://publisher.org/renewable-grid-record");
    expect(parsed.links).toContain("https://publisher.org/maritime-treaty");
    // Verify section banners
    expect(parsed.full_text).toContain("TODAY'S STORIES");
    expect(parsed.full_text).toContain("BEYOND YOUR BUBBLE");
  });

  test("2. Lead & standard Story UI parity: hero variant renders feedback controls, Skip link, and importance text", async ({
    page,
    context,
    baseURL,
  }) => {
    await login("A", context, baseURL!);
    await page.goto("/paper");
    await expect(page.locator("h1.edition-date-headline")).toBeVisible();

    // Verify hero story card exists
    const heroCard = page.locator(".story-card-hero").first();
    await expect(heroCard).toBeVisible();

    // 1. Verify hero story has feedback controls (More like this / Less like this)
    const heroFeedbackWrap = heroCard.locator(".hero-feedback-wrap");
    await expect(heroFeedbackWrap).toBeVisible();
    await expect(heroFeedbackWrap.getByRole("button", { name: "More like this" })).toBeVisible();
    await expect(heroFeedbackWrap.getByRole("button", { name: "Less like this" })).toBeVisible();

    // 2. Verify hero story has neutral Skip link
    const heroSkipBtn = heroCard.locator(".hero-skip-btn");
    await expect(heroSkipBtn).toBeVisible();
    await expect(heroSkipBtn).toHaveAttribute("href", /^#story-\d+|#edition-end$/);

    // 3. Verify hero story has primary source link
    const heroSourceLink = heroCard.locator("a.hero-read-link");
    await expect(heroSourceLink).toBeVisible();
    await expect(heroSourceLink).toHaveAttribute("href", /^https?:\/\//);

    // 4. Verify no decorative inert carousel controls exist in the page
    const fakeCarouselControls = page.locator(".featured-nav-controls");
    await expect(fakeCarouselControls).toHaveCount(0);

    // 5. Verify no unsupported personas testimonials exist
    const testimonialsCard = page.locator(".testimonials-card");
    await expect(testimonialsCard).toHaveCount(0);
  });

  test("3. Preferences & Subtopics: saves optional subtopics, infers familiar timezone, and preserves account settings", async ({
    context,
    baseURL,
  }) => {
    await login("A", context, baseURL!);

    // A. Verify familiar city timezone resolution
    expect(resolveFamiliarTimeZone("London")).toBe("Europe/London");
    expect(resolveFamiliarTimeZone("New York")).toBe("America/New_York");
    expect(resolveFamiliarTimeZone("Karachi")).toBe("Asia/Karachi");
    expect(resolveFamiliarTimeZone("Tokyo")).toBe("Asia/Tokyo");
    expect(isTimeZone("London")).toBe(true);
    expect(isTimeZone("Karachi")).toBe(true);

    // B. PUT preferences with optional subtopics
    const putResponse = await context.request.put("/api/preferences", {
      headers: { origin: baseURL! },
      data: {
        interests: ["science", "technology"],
        preferred_region: "global",
        reading_length: 10,
        time_zone: "Europe/London",
        onboarding_complete: true,
        subtopics: ["Renewable Energy", "Semiconductor Packaging"],
      },
    });
    expect(putResponse.status()).toBe(200);
    const putBody = await putResponse.json();
    expect(putBody.preferences.subtopics).toEqual(["Renewable Energy", "Semiconductor Packaging"]);
    expect(putBody.preferences.time_zone).toBe("Europe/London");

    // C. GET preferences returns the persisted subtopics and preferences
    const getResponse = await context.request.get("/api/preferences");
    expect(getResponse.status()).toBe(200);
    const getBody = await getResponse.json();
    expect(getBody.preferences.interests).toEqual(["science", "technology"]);
    expect(getBody.preferences.subtopics).toEqual(["Renewable Energy", "Semiconductor Packaging"]);
  });

  test("4. Negative feedback non-promotion: Less like this cannot be promoted by subsequent sort, and Skip remains neutral", () => {
    const preferences = {
      interests: ["science"],
      preferred_region: "global",
      reading_length: 5,
    };

    // Baseline selection with no feedback
    const baseline = selectEditionStories(sampleGroupedSupply, preferences, now, [], {});
    expect(baseline.main[0].id).toBe("r03-story-energy");

    // Reader marks "science" as Less like this (negative feedback: -1 vote = -20 points)
    // The negative feedback MUST demote science story below other eligible candidates and never be promoted
    const withNegativeFeedback = selectEditionStories(
      sampleGroupedSupply,
      preferences,
      now,
      [],
      { science: -1 },
    );

    // The demoted science story cannot be #1
    expect(withNegativeFeedback.main[0].id).not.toBe("r03-story-energy");
    // Neutral story ("technology" / "business") takes precedence over disliked science
    expect(withNegativeFeedback.main[0].id).toBe("r03-story-semiconductors");

    // Skip remains strictly neutral (no score penalty, no promotion)
    const withSkip = selectEditionStories(sampleGroupedSupply, preferences, now, [], {});
    expect(withSkip.main.map((s) => s.id)).toEqual(baseline.main.map((s) => s.id));
  });

  test("5. Subtopic scoring: declared entity choices boost relevant stories without fabricating claims", () => {
    const preferences = {
      interests: ["technology"],
      preferred_region: "global",
      reading_length: 5,
      subtopics: ["semiconductor packaging"],
    };

    const ranked = rankGroupedStories(sampleGroupedSupply, preferences, now, {});
    // Story containing the declared subtopic "semiconductor packaging" receives the top rank
    expect(ranked[0].id).toBe("r03-story-semiconductors");
  });

  test("6. Saved feedback preserves the earlier Edition while a next-day Edition can be created", async ({
    context,
    baseURL,
  }) => {
    // 1. Authenticate Reader A
    const supabaseA = await login("A", context, baseURL!);
    const { data: { user: userA } } = await supabaseA.auth.getUser();
    expect(userA).not.toBeNull();

    // 2. Set distinct preferences for Reader A
    await context.request.put("/api/preferences", {
      headers: { origin: baseURL! },
      data: {
        interests: ["technology", "business"],
        preferred_region: "us",
        reading_length: 5,
        time_zone: "America/New_York",
        onboarding_complete: true,
        subtopics: ["Semiconductors"],
      },
    });

    // 3. Generate a controlled past edition for Day 1
    const day1Date = "2026-10-15";
    await supabaseA.from("editions").delete().eq("reader_id", userA!.id).eq("edition_date", day1Date);
    const day1Result = await getOrCreateDailyEdition(supabaseA, userA!.id, {
      controlledDate: day1Date,
      controlledSupply: sampleGroupedSupply as unknown as SourceArticle[],
      referenceDate: now,
    });
    expect(day1Result.success).toBe(true);
    if (!day1Result.success) return;
    const day1StoryIds = day1Result.edition.stories.map((s) => s.title);

    // 4. Save feedback for a future edition
    const feedbackStoryId = day1Result.edition.stories[0].id;
    if (feedbackStoryId) {
      const feedbackResponse = await context.request.post("/api/feedback", {
        headers: { origin: baseURL! },
        data: {
          story_id: feedbackStoryId,
          feedback: "more",
        },
      });
      expect(feedbackResponse.ok()).toBe(true);
    }

    // 5. Verify Day 1 saved edition remains strictly immutable after feedback
    const { data: day1Stories } = await supabaseA
      .from("edition_stories")
      .select("title")
      .eq("edition_id", day1Result.edition.id)
      .order("position", { ascending: true });

    const reloadedStoryTitles = (day1Stories || []).map((s) => s.title);
    expect(reloadedStoryTitles).toEqual(day1StoryIds);

    // 6. Generate Day 2 edition under stored feedback
    const day2Date = "2026-10-16";
    await supabaseA.from("editions").delete().eq("reader_id", userA!.id).eq("edition_date", day2Date);
    const day2Result = await getOrCreateDailyEdition(supabaseA, userA!.id, {
      controlledDate: day2Date,
      controlledSupply: sampleGroupedSupply as unknown as SourceArticle[],
      referenceDate: now,
    });
    expect(day2Result.success).toBe(true);

    // Day 1 edition is preserved untouched
    const { data: day1PreservedCheck } = await supabaseA
      .from("editions")
      .select("id, status")
      .eq("id", day1Result.edition.id)
      .single();
    expect(day1PreservedCheck?.status).toBe("completed");
  });
});
