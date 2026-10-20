import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { login, testReadersConfigured } from "./helpers";
import { getOrCreateDailyEdition } from "../src/lib/edition/service";
import { getReportingSupply } from "../src/lib/edition/news-supply";
import { evaluateArticleQuality, filterEligibleArticles } from "../src/lib/edition/content-quality";
import { groupSourceArticles, canonicalizeSourceUrl } from "../src/lib/edition/grouping";
import { resolveArticleGeography } from "../src/lib/edition/geography";
import {
  NewsProviderCoordinator,
  type NewsProviderAdapter,
} from "../src/lib/edition/providers";
import type { SourceArticle } from "../src/lib/edition/types";

test.describe("Recovery R02: Diverse Stories from Complementary Providers", () => {
  test.skip(!testReadersConfigured, "Test readers required in .env.test.local");

  test("1. Multi-source normalized provenance: preserves provider identity, dates, publisher, language, text, topics, and output-use", async () => {
    const now = new Date();
    const candidateA: SourceArticle = {
      id: "a0000000-0000-0000-0000-000000000001",
      external_id: "prov-a-art-1",
      title: "Clean Energy Transition Accelerates Across Europe and North America",
      description: "Renewable power generation reaches record highs in latest quarterly analysis.",
      snippet: "Wind and solar infrastructure outpaces fossil fuels across Western nations.",
      url: "https://wire-a.publisher.org/clean-energy-transition?utm_source=rss",
      image_url: "https://wire-a.publisher.org/images/wind.jpg",
      publisher: "Clean Wire Service",
      published_at: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
      retrieved_at: now.toISOString(),
      language: "en",
      categories: ["science", "technology"],
      locale: "gb",
      raw_data: {
        provider: "thenewsapi",
        provider_article_id: "prov-a-art-1",
        output_use: "commercial",
        retrieved_at: now.toISOString(),
        canonical_url: "https://wire-a.publisher.org/clean-energy-transition",
        publisher_locale: "gb",
        event_geography: ["gb", "us"],
      },
    };

    const candidateB: SourceArticle = {
      id: "b0000000-0000-0000-0000-000000000002",
      external_id: "prov-b-art-2",
      title: "Global Semiconductor Manufacturers Invest Billions in New Fabrication Plants",
      description: "Chipmakers expand production facilities in the United States and Asia.",
      snippet: "Advanced packaging and high bandwidth memory drive historic infrastructure investments.",
      url: "https://wire-b.publisher.org/semiconductor-fab-investments#section-1",
      image_url: null,
      publisher: "Tech Global Daily",
      published_at: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
      retrieved_at: now.toISOString(),
      language: "en",
      categories: ["technology", "business"],
      locale: "us",
      raw_data: {
        provider: "newsdata",
        provider_article_id: "prov-b-art-2",
        output_use: "commercial",
        retrieved_at: now.toISOString(),
        canonical_url: "https://wire-b.publisher.org/semiconductor-fab-investments",
        publisher_locale: "us",
        event_geography: ["us"],
      },
    };

    // Evaluate both through the common quality policy
    const eligible = filterEligibleArticles([candidateA, candidateB], { now, maxAgeHours: 48 });
    expect(eligible.length).toBe(2);

    // Verify provenance is preserved in raw_data
    expect(eligible[0].raw_data?.provider).toBe("thenewsapi");
    expect(eligible[0].raw_data?.output_use).toBe("commercial");
    expect(eligible[1].raw_data?.provider).toBe("newsdata");
    expect(eligible[1].raw_data?.output_use).toBe("commercial");

    // Ingest into reader edition journey
    const supabaseA = await login("A");
    const testDate = "2026-10-18";

    // Clean any prior test edition
    const { data: readerAProfile } = await supabaseA.from("reader_preferences").select("reader_id").single();
    if (readerAProfile) {
      await supabaseA.from("editions").delete().eq("reader_id", readerAProfile.reader_id).eq("edition_date", testDate);
    }

    const result = await getOrCreateDailyEdition(supabaseA, readerAProfile!.reader_id, {
      controlledDate: testDate,
      controlledSupply: [candidateA, candidateB],
      referenceDate: now,
      forceRefresh: true,
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.edition.stories.length).toBeGreaterThan(0);
    const story = result.edition.stories[0];
    expect(story.supporting_sources).toBeDefined();
    expect(story.supporting_sources!.length).toBeGreaterThan(0);
    expect(story.supporting_sources![0].provider).toBeDefined();
  });

  test("2. Shared output eligibility: evaluation-only material is segregated from production Editions and previews", async () => {
    const now = new Date();

    const commercialArticle: SourceArticle = {
      id: "comm-art-1",
      external_id: "comm-art-1",
      title: "Global Central Banks Coordinate Policy Amid Inflation Moderation",
      description: "Financial authorities announce synchronized rate adjustments.",
      snippet: "Economic indicators show stabilized consumer spending and price targets.",
      url: "https://financialwire.publisher.org/central-bank-policy",
      image_url: null,
      publisher: "Financial Wire",
      published_at: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
      retrieved_at: now.toISOString(),
      language: "en",
      categories: ["business"],
      locale: "us",
      raw_data: {
        provider: "thenewsapi",
        output_use: "commercial",
      },
    };

    const evalOnlyArticle: SourceArticle = {
      id: "eval-art-2",
      external_id: "eval-art-2",
      title: "Confidential Market Analysis of Emerging Technology Startups",
      description: "Evaluation internal review of venture funding trajectories.",
      snippet: "Proprietary research dataset for internal assessment purposes only.",
      url: "https://eval-research.publisher.org/market-analysis",
      image_url: null,
      publisher: "Internal Research Desk",
      published_at: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
      retrieved_at: now.toISOString(),
      language: "en",
      categories: ["business", "technology"],
      locale: "us",
      raw_data: {
        provider: "gnews",
        output_use: "evaluation_only",
      },
    };

    // A. Quality evaluation rejects evaluation_only by default
    const evalRes = evaluateArticleQuality(evalOnlyArticle, {
      now,
      allowEvaluationOnly: false,
    });
    expect(evalRes.eligible).toBe(false);
    expect(evalRes.reason).toBe("disallowed_output_use");

    // B. Quality evaluation accepts evaluation_only if explicitly allowed
    const evalAllowedRes = evaluateArticleQuality(evalOnlyArticle, {
      now,
      allowEvaluationOnly: true,
    });
    expect(evalAllowedRes.eligible).toBe(true);

    // C. Grouping excludes evaluation-only material from production groups
    const groups = groupSourceArticles([commercialArticle, evalOnlyArticle], {
      allowEvaluationOnly: false,
    });
    expect(groups.length).toBe(1);
    expect(groups[0].title).toBe(commercialArticle.title);
    expect(groups[0].supportingArticles.every((s) => s.raw_data?.output_use !== "evaluation_only")).toBe(true);
  });

  test("3. Canonical deduplication & cross-provider same-event grouping: links supporting sources and preserves distinct events", async () => {
    const now = new Date();

    // A. Exact canonical URL deduplication across providers (different query params)
    const urlA = "https://reuters.publisher.org/article/tech-ai-breakthrough?utm_source=twitter&ref=wire";
    const urlB = "https://reuters.publisher.org/article/tech-ai-breakthrough/";

    expect(canonicalizeSourceUrl(urlA)).toBe("https://reuters.publisher.org/article/tech-ai-breakthrough");
    expect(canonicalizeSourceUrl(urlB)).toBe("https://reuters.publisher.org/article/tech-ai-breakthrough");
    expect(canonicalizeSourceUrl(urlA)).toBe(canonicalizeSourceUrl(urlB));

    // B. Conservative cross-provider same-event grouping (same event, different provider IDs & headlines)
    const event1ProviderA: SourceArticle = {
      id: "p1-space-mission",
      external_id: "p1-space-mission",
      title: "NASA Astronauts Successfully Complete Historic Six Hour Spacewalk Outside Space Station",
      description: "Flight engineers replace communication antenna and conduct solar array maintenance in orbit.",
      snippet: "Astronauts Jessica Meir and mission specialist conclude orbital operations outside the ISS.",
      url: "https://spaceflight-daily.publisher.org/astronauts-complete-spacewalk",
      image_url: "https://spaceflight-daily.publisher.org/iss.jpg",
      publisher: "Spaceflight Daily",
      published_at: new Date(now.getTime() - 3 * 3600 * 1000).toISOString(),
      language: "en",
      categories: ["science", "technology"],
      locale: "us",
      raw_data: { provider: "thenewsapi", output_use: "commercial" },
    };

    const event1ProviderB: SourceArticle = {
      id: "p2-space-mission",
      external_id: "p2-space-mission",
      title: "NASA Astronauts Complete Complex Spacewalk Outside International Space Station",
      description: "Astronauts replace orbital communication antenna during six hour spacewalk mission.",
      snippet: "Space Station engineers safely wrap up exterior hardware upgrades.",
      url: "https://aero-wire.publisher.org/iss-spacewalk-concludes",
      image_url: null,
      publisher: "Aerospace Wire",
      published_at: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
      language: "en",
      categories: ["science"],
      locale: "us",
      raw_data: { provider: "gnews", output_use: "commercial" },
    };

    // C. Distinct event in the same category (must stay separate!)
    const event2Separate: SourceArticle = {
      id: "p1-james-webb",
      external_id: "p1-james-webb",
      title: "James Webb Space Telescope Detects Water Vapor in Habitable Zone of Exoplanet Atmosphere",
      description: "Astronomers observe atmospheric biosignatures in planetary system 100 light years away.",
      snippet: "Spectroscopic data confirms hydrogen and moisture on distant super-Earth.",
      url: "https://astronomy-today.publisher.org/webb-exoplanet-water",
      image_url: null,
      publisher: "Astronomy Today",
      published_at: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
      language: "en",
      categories: ["science"],
      locale: "gb",
      raw_data: { provider: "thenewsapi", output_use: "commercial" },
    };

    const groups = groupSourceArticles([event1ProviderA, event1ProviderB, event2Separate]);

    // Should create exactly 2 distinct groups: Spacewalk event (grouped) and Exoplanet event (separate)
    expect(groups.length).toBe(2);

    const spacewalkGroup = groups.find((g) => g.title.includes("Spacewalk"));
    expect(spacewalkGroup).toBeDefined();
    expect(spacewalkGroup!.supportingArticles.length).toBe(2);

    const exoplanetGroup = groups.find((g) => g.title.includes("James Webb"));
    expect(exoplanetGroup).toBeDefined();
    expect(exoplanetGroup!.supportingArticles.length).toBe(1);
  });

  test("4. Event geography versus publisher country: distinguishes reporting location from publisher registration", async () => {
    // Article A: Pakistani publisher reporting on a US presidential debate in Washington
    const foreignEventLocalPublisher = {
      title: "US Presidential Candidates Clash Over Economic Policy During Heated Washington Debate",
      description: "Candidates debate federal spending, taxation, and industrial subsidies in Washington D.C.",
      snippet: "White House hopefuls outline conflicting economic platforms before congressional leaders.",
      locale: "pk", // Publisher is registered in Pakistan (e.g. Dawn / Geo)
    };

    const geoA = resolveArticleGeography(foreignEventLocalPublisher);
    expect(geoA.publisherCountry).toBe("pk");
    expect(geoA.eventGeography).toContain("us");
    expect(geoA.eventGeography).not.toContain("pk");
    expect(geoA.isEventCountryConfirmed).toBe(false);

    // Article B: Foreign publisher reporting on floods in Pakistan (Karachi, Sindh)
    const localEventForeignPublisher = {
      title: "Monsoon Floods Displace Thousands in Karachi and Rural Sindh as Relief Operations Expand",
      description: "Emergency teams deliver clean water and rations across southern Pakistan provinces.",
      snippet: "Pakistani disaster management officials coordinate emergency shelters.",
      locale: "gb", // Publisher is registered in UK (e.g. BBC / Reuters)
    };

    const geoB = resolveArticleGeography(localEventForeignPublisher);
    expect(geoB.publisherCountry).toBe("gb");
    expect(geoB.eventGeography).toContain("pk");
    expect(geoB.isEventCountryConfirmed).toBe(false);

    // Article C: General tech article with absent geography (global fallback)
    const absentGeographyArticle = {
      title: "Next Generation Quantum Processors Achieve Record Coherence Times",
      description: "Researchers demonstrate novel topological qubits with extended stability.",
      snippet: "Laboratory benchmarks indicate substantial error reduction in modular architectures.",
      locale: null,
      raw_data: { provider: "thenewsapi", output_use: "commercial" },
    };

    const geoC = resolveArticleGeography(absentGeographyArticle);
    expect(geoC.publisherCountry).toBeNull();
    expect(geoC.eventGeography.length).toBe(0);
    expect(geoC.isEventCountryConfirmed).toBe(false);
  });

  test("5. Graceful one-provider failure: continues reading when one provider fails or times out", async () => {
    const now = new Date();

    // Mock Provider A (Fails with HTTP 429 quota exceeded)
    const failingProvider: NewsProviderAdapter = {
      name: "failing-provider",
      defaultOutputUse: "commercial",
      isConfigured: () => true,
      fetchCandidates: async () => {
        throw new Error("HTTP 429: Daily request limit exceeded for failing-provider");
      },
    };

    // Mock Provider B (Succeeds with fresh valid reporting)
    const healthyProvider: NewsProviderAdapter = {
      name: "healthy-provider",
      defaultOutputUse: "commercial",
      isConfigured: () => true,
      fetchCandidates: async () => ({
        candidates: [
          {
            id: "healthy-1",
            title: "Global Ocean Exploration Project Discovers Hundreds of Deep Sea Species",
            description: "Marine biologists map underwater mountain ridges and uncharted hydrothermal vents.",
            snippet: "Expedition vessels catalogue unprecedented biodiversity in international waters.",
            url: "https://ocean-exploration.publisher.org/deep-sea-species",
            image_url: null,
            publisher: "Ocean Science Wire",
            published_at: new Date(now.getTime() - 1 * 3600 * 1000).toISOString(),
            retrieved_at: now.toISOString(),
            language: "en",
            categories: ["science", "general"],
            locale: "global",
            raw_data: { provider: "thenewsapi", output_use: "commercial" },
            provider: "healthy-provider",
            output_use: "commercial",
            event_geography: [],
          },
        ],
        success: true,
        providerCalls: 1,
      }),
    };

    const coordinator = new NewsProviderCoordinator([failingProvider, healthyProvider]);
    const result = await coordinator.fetchAll({ now });

    // Coordinator captures the error from failingProvider but gracefully succeeds with healthyProvider!
    expect(result.success).toBe(true);
    expect(result.articles.length).toBe(1);
    expect(result.articles[0].title).toBe("Global Ocean Exploration Project Discovers Hundreds of Deep Sea Species");
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].provider).toBe("failing-provider");
  });

  test("6. Shared cache reuse: successive calls within cache window reuse pool without redundant provider fetches", async () => {
    const supabaseA = await login("A");
    const now = new Date();
    const key = process.env.SUPABASE_REPORTING_SERVICE_KEY;
    expect(key, "Configure the dedicated test project's server key; this test must seed its own cache").toBeTruthy();
    if (!key) return;
    const server = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const writer = { rpc: server.rpc.bind(server) };
    const previousMeta = await server.from("reporting_cache_meta").select("*").eq("id", "news_supply").maybeSingle();
    expect(previousMeta.error).toBeNull();
    let providerCalls = 0;
    const coordinator = new NewsProviderCoordinator([{
      name: "thenewsapi", defaultOutputUse: "commercial", isConfigured: () => true,
      fetchCandidates: async () => {
        providerCalls++;
        return { success: true, providerCalls: 1, candidates: [{
          id: "r02-shared-cache-fixture", provider: "thenewsapi", output_use: "commercial",
          title: "Ocean expedition publishes survey of deep sea habitats",
          description: "The ocean expedition published a survey of deep sea habitats and released the sampling methods used to identify species across the study area.",
          snippet: null, image_url: null, url: "https://publisher.org/r02-shared-cache",
          publisher: "Controlled Ocean Reporting", published_at: now.toISOString(), retrieved_at: now.toISOString(),
          language: "en", categories: ["science"], locale: null, raw: { test_fixture: "r02-shared-cache" },
        }] };
      },
    }]);
    try {
      // Start with a fresh quota fixture in this dedicated test project only.
      expect((await server.from("reporting_cache_meta").delete().eq("id", "news_supply")).error).toBeNull();
      const first = await getReportingSupply(supabaseA, { referenceDate: now, coordinator, reportingWriter: writer, forceRefresh: true });
      expect(first.some(article => article.external_id === "r02-shared-cache-fixture")).toBe(true);
      const supabaseB = await login("B");
      const second = await getReportingSupply(supabaseB, { referenceDate: now, coordinator, reportingWriter: writer });
      expect(second.map(article => article.external_id)).toEqual(first.map(article => article.external_id));
      expect(providerCalls).toBe(1);
    } finally {
      // Exact fixture cleanup is confined to this approved test database.
      expect((await server.from("source_articles").delete().eq("external_id", "r02-shared-cache-fixture")).error).toBeNull();
      expect((await server.from("reporting_cache_meta").delete().eq("id", "news_supply")).error).toBeNull();
      if (previousMeta.data) {
        expect((await server.from("reporting_cache_meta").insert(previousMeta.data)).error).toBeNull();
      }
    }
  });
});
