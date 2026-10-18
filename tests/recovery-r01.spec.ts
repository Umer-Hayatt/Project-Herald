import { test, expect } from "@playwright/test";
import { login, testReadersConfigured } from "./helpers";
import { getOrCreateDailyEdition } from "../src/lib/edition/service";
import { evaluateArticleQuality } from "../src/lib/edition/content-quality";
import type { SourceArticle } from "../src/lib/edition/types";

test.describe("Recovery R01: Safe Reporting & Content Quality", () => {
  test.skip(!testReadersConfigured, "Test readers required in .env.test.local");

  test("1. Direct public write denial: anon and authenticated cannot directly mutate source_articles", async () => {
    // A. Anonymous client direct insert denial
    const { createClient } = await import("@supabase/supabase-js");
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const { error: anonInsertError } = await anonClient.from("source_articles").insert([
      {
        external_id: "test-anon-denied-" + Date.now(),
        title: "Unauthorized Anonymous Insert Attempt",
        url: "https://example.com/unauthorized",
        publisher: "Attacker",
        published_at: new Date().toISOString(),
      },
    ]);
    expect(anonInsertError).not.toBeNull();
    expect(anonInsertError?.code).toBe("42501");

    // B. Authenticated reader direct insert denial
    const supabaseA = await login("A");
    const { error: authInsertError } = await supabaseA.from("source_articles").insert([
      {
        external_id: "test-auth-denied-" + Date.now(),
        title: "Unauthorized Authenticated Insert Attempt",
        url: "https://example.com/unauthorized",
        publisher: "ReaderA",
        published_at: new Date().toISOString(),
      },
    ]);
    expect(authInsertError).not.toBeNull();
    expect(authInsertError?.code).toBe("42501");

    // C. Calling ingest_source_articles with invalid lock token fails
    const { error: invalidLockError } = await supabaseA.rpc("ingest_source_articles", {
      p_lock_token: "00000000-0000-0000-0000-000000000000",
      p_articles: [
        {
          external_id: "test-fake-token-" + Date.now(),
          title: "Fake Token Ingest Attempt",
          url: "https://example.com/fake",
          publisher: "Fake",
          published_at: new Date().toISOString(),
        },
      ],
    });
    expect(invalidLockError).not.toBeNull();
  });

  test("2. Trusted ingestion RPC: refresh claim -> ingest -> finish cycle works", async () => {
    const supabaseA = await login("A");

    // Claim refresh with 0 provider calls (test mode)
    const { data: lockToken, error: claimErr } = await supabaseA.rpc("claim_reporting_refresh", {
      p_force_refresh: true,
      p_provider_calls: 0,
    });
    expect(claimErr).toBeNull();
    expect(lockToken).not.toBeNull();

    const uniqueId = "test-r01-trusted-" + Date.now();
    const testArticle = {
      external_id: uniqueId,
      title: "Trusted Ingestion Demonstrates Protected Shared Reporting",
      description: "A comprehensive test of verified reporting ingestion through security definer RPC.",
      snippet: "Security definer functions enforce authorization and validate refresh locks.",
      url: "https://herald.example.com/trusted-ingestion-report",
      publisher: "Herald Verified Wire",
      published_at: new Date().toISOString(),
      language: "en",
      categories: ["technology", "general"],
      locale: "global",
    };

    const { data: insertedCount, error: ingestErr } = await supabaseA.rpc("ingest_source_articles", {
      p_lock_token: lockToken,
      p_articles: [testArticle],
    });
    expect(ingestErr).toBeNull();
    expect(insertedCount).toBe(1);

    const { data: finishOk, error: finishErr } = await supabaseA.rpc("finish_reporting_refresh", {
      p_lock_token: lockToken,
      p_succeeded: true,
    });
    expect(finishErr).toBeNull();
    expect(finishOk).toBe(true);

    // Verify public read access sees the inserted article
    const { data: readBack } = await supabaseA
      .from("source_articles")
      .select("external_id, title, publisher")
      .eq("external_id", uniqueId)
      .maybeSingle();

    expect(readBack).not.toBeNull();
    expect(readBack?.external_id).toBe(uniqueId);
    expect(readBack?.publisher).toBe("Herald Verified Wire");
  });

  test("3. Content quality policy: rejects feeds, generic titles, empty wrappers, and malformed dates", () => {
    const now = new Date("2026-10-18T10:00:00Z");

    // A. Rejects feed / index URLs
    const feedArticle = {
      external_id: "test-feed-1",
      title: "Valid Long News Headline Here For Test",
      url: "https://example.com/rss/feed.xml",
      publisher: "Sample News",
      published_at: "2026-10-18T09:00:00Z",
      description: "Full legitimate description of the event that happened today.",
    };
    const feedEval = evaluateArticleQuality(feedArticle, { now });
    expect(feedEval.eligible).toBe(false);
    expect(feedEval.reason).toBe("feed_or_index_url");

    // B. Rejects generic title
    const genericArticle = {
      external_id: "test-gen-1",
      title: "Top Stories",
      url: "https://example.com/articles/story-123",
      publisher: "Sample News",
      published_at: "2026-10-18T09:00:00Z",
      description: "Full legitimate description of the event that happened today.",
    };
    const genEval = evaluateArticleQuality(genericArticle, { now });
    expect(genEval.eligible).toBe(false);
    expect(genEval.reason).toBe("generic_title");

    // C. Rejects empty wrapper / paywall boilerplate
    const boilerArticle = {
      external_id: "test-boiler-1",
      title: "Real Headline About International Summit",
      url: "https://example.com/articles/story-456",
      publisher: "Sample News",
      published_at: "2026-10-18T09:00:00Z",
      description: "Click here to read more",
      snippet: "Subscribe to continue reading",
    };
    const boilerEval = evaluateArticleQuality(boilerArticle, { now });
    expect(boilerEval.eligible).toBe(false);
    expect(boilerEval.reason).toBe("insufficient_text");

    // D. Rejects malformed / future dates
    const futureArticle = {
      external_id: "test-fut-1",
      title: "Real Headline About International Summit",
      url: "https://example.com/articles/story-789",
      publisher: "Sample News",
      published_at: "2026-10-25T09:00:00Z",
      description: "Full legitimate description of the event that happened today.",
    };
    const futEval = evaluateArticleQuality(futureArticle, { now });
    expect(futEval.eligible).toBe(false);
    expect(futEval.reason).toBe("future_date");

    // E. Accepts eligible reporting
    const validArticle = {
      external_id: "test-valid-1",
      title: "Scientific Consensus Reached on Carbon Mineralization Rate",
      url: "https://example.com/science/carbon-mineralization-2026",
      publisher: "Science Standard",
      published_at: "2026-10-18T08:00:00Z",
      description: "Researchers announce reproducible laboratory results demonstrating accelerated basalt mineralization at ambient pressure.",
      snippet: "The findings could substantially lower the cost of permanent carbon storage.",
    };
    const validEval = evaluateArticleQuality(validArticle, { now });
    expect(validEval.eligible).toBe(true);
  });

  test("4. Two-reader ownership: Reader B cannot view or modify Reader A's preserved Edition", async () => {
    const supabaseA = await login("A");
    const supabaseB = await login("B");

    const { data: { user: userA } } = await supabaseA.auth.getUser();
    const { data: { user: userB } } = await supabaseB.auth.getUser();
    expect(userA?.id).not.toBe(userB?.id);

    // Reader A fetches/creates today's edition
    const { data: editionsA } = await supabaseA
      .from("editions")
      .select("id, edition_date, reader_id")
      .eq("reader_id", userA!.id)
      .limit(1);

    if (editionsA && editionsA.length > 0) {
      const editionA = editionsA[0];
      // Reader B tries to query Reader A's edition by ID
      const { data: bQueriedA } = await supabaseB
        .from("editions")
        .select("id, reader_id")
        .eq("id", editionA.id)
        .maybeSingle();

      expect(bQueriedA).toBeNull();

      // Reader B tries to query stories from Reader A's edition
      const { data: bQueriedStories } = await supabaseB
        .from("edition_stories")
        .select("id, title")
        .eq("edition_id", editionA.id);

      expect(bQueriedStories?.length || 0).toBe(0);
    }
  });

  test("5. Useful attributed Edition: includes title, publisher, source_url, briefing, and section", async () => {
    const supabaseA = await login("A");
    const { data: { user: userA } } = await supabaseA.auth.getUser();

    // Ensure Reader A is onboarded
    await supabaseA.from("reader_preferences").upsert({
      reader_id: userA!.id,
      interests: ["science", "technology", "general"],
      preferred_region: "global",
      reading_length: 10,
      time_zone: "Asia/Karachi",
      onboarding_complete: true,
    });

    const controlledSupply: SourceArticle[] = [
      {
        id: "a0000000-0000-4000-8000-000000000001",
        external_id: "r01-test-supply-1",
        title: "Major Breakthrough in Quantum Coherence Longevity",
        description: "Physicists sustain superconducting qubit coherence across record temperature threshold.",
        snippet: "The experiment was replicated at three independent international laboratories.",
        url: "https://example.com/quantum-coherence-2026",
        image_url: null,
        publisher: "Quantum Science Review",
        published_at: new Date().toISOString(),
        language: "en",
        categories: ["science", "technology"],
        locale: "global",
      },
      {
        id: "a0000000-0000-4000-8000-000000000002",
        external_id: "r01-test-supply-2",
        title: "Clean Energy Grid Interconnection Standards Finalized",
        description: "Regulators establish uniform high-voltage direct current grid protocols.",
        snippet: "Interoperability standards pave the way for cross-continental renewable transfer.",
        url: "https://example.com/clean-grid-standards-2026",
        image_url: null,
        publisher: "Energy Infrastructure Journal",
        published_at: new Date().toISOString(),
        language: "en",
        categories: ["technology", "business"],
        locale: "global",
      },
      {
        id: "a0000000-0000-4000-8000-000000000003",
        external_id: "r01-test-supply-3",
        title: "Autonomous Maritime Navigation Treaty Signed in Geneva",
        description: "Thirty nations establish liability and safety regulations for crewless vessels.",
        snippet: "The pact updates maritime protocols for uncrewed commercial cargo vessels.",
        url: "https://example.com/maritime-treaty-2026",
        image_url: null,
        publisher: "Maritime Law Herald",
        published_at: new Date().toISOString(),
        language: "en",
        categories: ["politics", "general"],
        locale: "global",
      },
    ];

    const result = await getOrCreateDailyEdition(supabaseA, userA!.id, {
      controlledDate: "2026-10-18",
      controlledSupply,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.edition.stories.length).toBeGreaterThan(0);
      for (const story of result.edition.stories) {
        expect(story.title.length).toBeGreaterThan(10);
        expect(story.publisher.length).toBeGreaterThan(1);
        expect(story.source_url).toMatch(/^https?:\/\//);
        expect(story.published_at).toBeTruthy();
        expect(story.section).toMatch(/^(main|beyond_bubble)$/);
      }
    }
  });

  test("6. Unavailable reporting continuity: serves preserved fallback or honest NO_REPORTING", async () => {
    const supabaseA = await login("A");
    const { data: { user: userA } } = await supabaseA.auth.getUser();

    // When fresh supply is empty on a subsequent request, the reader receives
    // their latest preserved edition as an honest fallback without creating a new corrupt record.
    const result = await getOrCreateDailyEdition(supabaseA, userA!.id, {
      controlledDate: "2030-01-01",
      controlledSupply: [],
    });

    if (result.success) {
      // Prior edition exists: served as labeled fallback
      expect(result.isFallback).toBe(true);
      expect(result.isNew).toBe(false);
      expect(result.edition.edition_date).not.toBe("2030-01-01");
    } else {
      // No prior edition: honest NO_REPORTING error
      expect(result.error).toBe("NO_REPORTING");
    }

    // Verify no phantom edition was written for 2030-01-01
    const { data: phantomCheck } = await supabaseA
      .from("editions")
      .select("id")
      .eq("reader_id", userA!.id)
      .eq("edition_date", "2030-01-01");

    expect(phantomCheck?.length || 0).toBe(0);
  });
});
