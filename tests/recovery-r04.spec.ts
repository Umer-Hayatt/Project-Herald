import { test, expect } from "@playwright/test";
import { login, testReadersConfigured } from "./helpers";
import { getOrCreateDailyEdition } from "../src/lib/edition/service";
import { selectEditionStories, rankGroupedStories } from "../src/lib/edition/ranking";
import { isSameEvent, detectEventUpdate, evaluateRecentInclusion, type RecentIncludedEvent } from "../src/lib/edition/events";
import type { GroupedSourceArticle, SourceArticle } from "../src/lib/edition/types";

const now = new Date("2026-10-19T10:00:00Z");

const pastEventCleanEnergy: RecentIncludedEvent = {
  title: "Global Clean Energy Initiative Reaches Milestone With Record Solar Targets",
  sourceUrl: "https://example.com/clean-energy-summit",
  category: "science",
  publishedAt: "2026-10-18T08:00:00Z",
  editionDate: "2026-10-18",
  briefing: "International summit establishes ambitious solar deployment targets for 2030.",
  whyItMatters: "Grid capacity determines the real-world deployment speed.",
  supportingUrls: ["https://example.com/clean-energy-summit-wire"],
};

const candidateUnchangedRepeat: GroupedSourceArticle = {
  id: "r04-unchanged-clean-energy",
  external_id: "gnews-clean-energy-syndicated",
  title: "Global Clean Energy Initiative Reaches Milestone With Record Solar Targets",
  description: "International summit establishes ambitious solar targets across Western nations.",
  snippet: "Grid capacity determines deployment speed.",
  url: "https://example.com/clean-energy-summit-syndicated",
  image_url: null,
  publisher: "Alternative Wire Syndication",
  published_at: "2026-10-18T09:00:00Z",
  language: "en",
  categories: ["science"],
  locale: "global",
  supportingArticles: [],
  briefing: "International summit establishes ambitious solar targets across Western nations.",
  whyItMatters: "Grid capacity determines deployment speed.",
  topics: ["science"],
  briefingSource: "publisher_excerpt",
};

const candidateMaterialUpdate: GroupedSourceArticle = {
  id: "r04-update-clean-energy",
  external_id: "thenewsapi-clean-energy-update",
  title: "Update: European Commission Approves Funding Framework for Solar Summit Targets",
  description: "Following weekend climate summit agreements, regulators approve formal subsidy disbursements.",
  snippet: "First round of grid grants unlocked under the global milestone agreement.",
  url: "https://example.com/clean-energy-funding-approved",
  image_url: null,
  publisher: "European Policy Dispatch",
  published_at: "2026-10-19T06:30:00Z",
  language: "en",
  categories: ["science", "politics"],
  locale: "global",
  supportingArticles: [
    {
      id: "supp-energy-1",
      external_id: "supp-energy-ext-1",
      title: "Global Clean Energy Initiative Reaches Milestone With Record Solar Targets",
      description: "Previous summit background.",
      snippet: null,
      url: "https://example.com/clean-energy-summit",
      image_url: null,
      publisher: "Clean Wire Service",
      published_at: "2026-10-18T08:00:00Z",
      language: "en",
      categories: ["science"],
      locale: "global",
    },
  ],
  briefing: "Following climate summit agreements, regulators approve formal subsidy disbursements.",
  whyItMatters: "Direct funding turns treaty commitments into transmission infrastructure.",
  topics: ["science"],
  briefingSource: "publisher_excerpt",
};

const candidateDistinctEventSameTopic: GroupedSourceArticle = {
  id: "r04-distinct-science-fusion",
  external_id: "newsdata-fusion-record",
  title: "Fusion Reactor Milestone Achieved at Magnetic Confinement Facility",
  description: "Physicists sustain high-density plasma reaction for over twenty minutes.",
  snippet: "New superconducting magnets prevent core instability.",
  url: "https://example.com/fusion-reactor-milestone",
  image_url: null,
  publisher: "Physics Gazette",
  published_at: "2026-10-19T07:00:00Z",
  language: "en",
  categories: ["science"],
  locale: "global",
  supportingArticles: [],
  briefing: "Physicists sustain high-density plasma reaction for over twenty minutes.",
  whyItMatters: "Extended containment brings commercial net-energy generation closer.",
  topics: ["science"],
  briefingSource: "publisher_excerpt",
};

test.describe("Recovery R04: Reduce repeated events while retaining meaningful updates", () => {
  test("1. Cross-provider event lineage: recognizes alternate provider reporting of same event", () => {
    // Alternate provider copy has different ID, URL and publisher, but same event content
    const isMatched = isSameEvent(candidateUnchangedRepeat, pastEventCleanEnergy);
    expect(isMatched).toBe(true);

    const evaluation = evaluateRecentInclusion(candidateUnchangedRepeat, [pastEventCleanEnergy]);
    expect(evaluation.status).toBe("unchanged_repeat");
    expect(evaluation.matchedEvent?.title).toBe(pastEventCleanEnergy.title);
  });

  test("2. Unchanged repeat deprioritization: down-ranks repeat while fresh stories take precedence", () => {
    const preferences = {
      interests: ["science"],
      preferred_region: "global",
      reading_length: 5,
    };

    // Baseline ranking without history: unchanged repeat (published earlier) vs fusion story
    const supply = [candidateUnchangedRepeat, candidateDistinctEventSameTopic];
    const withoutHistory = rankGroupedStories(supply, preferences, now, {}, []);
    expect(withoutHistory.length).toBe(2);

    // With past inclusion history of clean energy:
    const withHistory = rankGroupedStories(supply, preferences, now, {}, [pastEventCleanEnergy]);
    // The completely fresh fusion event takes precedence over the unchanged repeat
    expect(withHistory[0].id).toBe("r04-distinct-science-fusion");
    expect(withHistory[1].id).toBe("r04-unchanged-clean-energy");

    // Selection respects the deprioritization under reading length constraint
    const selection = selectEditionStories(supply, preferences, now, [], {}, [pastEventCleanEnergy]);
    expect(selection.main[0].id).toBe("r04-distinct-science-fusion");
  });

  test("3. Distinct events sharing a broad topic are NOT deprioritized", () => {
    // Both are "science" stories, but fusion reactor is a completely distinct event from solar summit
    const evaluation = evaluateRecentInclusion(candidateDistinctEventSameTopic, [pastEventCleanEnergy]);
    expect(evaluation.status).toBe("fresh");

    const isMatch = isSameEvent(candidateDistinctEventSameTopic, pastEventCleanEnergy);
    expect(isMatch).toBe(false);
  });

  test("4. Materially new update remains eligible and saves honest update explanation", () => {
    const isMatch = isSameEvent(candidateMaterialUpdate, pastEventCleanEnergy);
    expect(isMatch).toBe(true);

    const updateCheck = detectEventUpdate(candidateMaterialUpdate, pastEventCleanEnergy);
    expect(updateCheck.isUpdate).toBe(true);
    expect(updateCheck.explanation).toContain("Updates previous coverage");

    const evaluation = evaluateRecentInclusion(candidateMaterialUpdate, [pastEventCleanEnergy]);
    expect(evaluation.status).toBe("update");
    expect(evaluation.updateExplanation).toContain("Updates previous coverage");

    const preferences = {
      interests: ["science"],
      preferred_region: "global",
      reading_length: 5,
    };

    const supply = [candidateUnchangedRepeat, candidateMaterialUpdate];
    const ranked = rankGroupedStories(supply, preferences, now, {}, [pastEventCleanEnergy]);

    // Material update outranks unchanged repeat
    expect(ranked[0].id).toBe("r04-update-clean-energy");
    expect(ranked[0].isUpdate).toBe(true);
    expect(ranked[0].updateExplanation).toBeDefined();
  });

  test("5. Two-reader isolation: past event deprioritized for Reader A but fresh for Reader B", async ({
    context,
    baseURL,
  }) => {
    test.skip(!testReadersConfigured, "Test readers must be configured in .env.test.local");

    const supabaseA = await login("A", context, baseURL!);
    const supabaseB = await login("B", context, baseURL!);

    const { data: { user: userA } } = await supabaseA.auth.getUser();
    const { data: { user: userB } } = await supabaseB.auth.getUser();
    expect(userA).not.toBeNull();
    expect(userB).not.toBeNull();

    const preferences = {
      interests: ["science"],
      preferred_region: "global",
      reading_length: 5,
      subtopics: [],
    };

    // Reader A includes Clean Energy on Day 1
    const day1RecentInclusionsA: RecentIncludedEvent[] = [pastEventCleanEnergy];
    // Reader B did not have Clean Energy in their past 7 editions
    const day1RecentInclusionsB: RecentIncludedEvent[] = [];

    const supply = [candidateUnchangedRepeat, candidateDistinctEventSameTopic];

    const selectionA = selectEditionStories(supply, preferences, now, [], {}, day1RecentInclusionsA);
    const selectionB = selectEditionStories(supply, preferences, now, [], {}, day1RecentInclusionsB);

    // For Reader A, unchanged repeat is deprioritized -> fusion is top
    expect(selectionA.main[0].id).toBe("r04-distinct-science-fusion");

    // For Reader B, both are eligible without history penalty; the earlier solar story retains its normal rank
    expect(selectionB.main.some((s) => s.id === "r04-unchanged-clean-energy")).toBe(true);
  });

  test("6. Multi-day sequential creation: past editions and archived content remain strictly immutable", async ({
    context,
    baseURL,
  }) => {
    test.skip(!testReadersConfigured, "Test readers must be configured in .env.test.local");

    const supabaseA = await login("A", context, baseURL!);
    const { data: { user: userA } } = await supabaseA.auth.getUser();
    expect(userA).not.toBeNull();

    // 1. Generate Day 1 edition
    const day1Date = "2026-10-17";
    await supabaseA.from("editions").delete().eq("reader_id", userA!.id).eq("edition_date", day1Date);
    const day1Result = await getOrCreateDailyEdition(supabaseA, userA!.id, {
      controlledDate: day1Date,
      controlledSupply: [candidateUnchangedRepeat as unknown as SourceArticle],
    });
    expect(day1Result.success).toBe(true);
    if (!day1Result.success) return;

    const day1StoriesOriginal = day1Result.edition.stories.map((s) => ({
      title: s.title,
      source_url: s.source_url,
      why_it_matters: s.why_it_matters,
    }));

    // 2. Generate Day 2 edition with a real update
    const day2Date = "2026-10-18";
    await supabaseA.from("editions").delete().eq("reader_id", userA!.id).eq("edition_date", day2Date);
    const day2Result = await getOrCreateDailyEdition(supabaseA, userA!.id, {
      controlledDate: day2Date,
      controlledSupply: [candidateMaterialUpdate as unknown as SourceArticle],
      controlledRecentInclusions: [pastEventCleanEnergy],
    });
    expect(day2Result.success).toBe(true);
    if (!day2Result.success) return;

    // Verify Day 2 story carries update explanation
    expect(day2Result.edition.stories[0].is_update).toBe(true);
    expect(day2Result.edition.stories[0].update_explanation).toContain("Updates previous coverage");

    // 3. Verify Day 1 saved edition remains strictly immutable after Day 2 creation
    const { data: day1StoriesReloaded } = await supabaseA
      .from("edition_stories")
      .select("title, source_url, why_it_matters")
      .eq("edition_id", day1Result.edition.id)
      .order("position", { ascending: true });

    expect(day1StoriesReloaded).toEqual(day1StoriesOriginal);
  });
});
