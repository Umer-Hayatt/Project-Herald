import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { executeBoundedTargetedSearch, clearSearchCacheForTesting, refineEditionWithTargetedSearch } from "../../src/lib/edition/targeted-search";

test("live search requires explicit rights and a shared database reservation", async () => {
  const oldKey = process.env.GNEWS_API_KEY;
  const oldApproval = process.env.GNEWS_COMMERCIAL_APPROVED;
  const originalFetch = globalThis.fetch;
  let providerCalls = 0;
  let reservations = 0;
  let finishes = 0;
  let allowReservation = false;
  let sharedResults: unknown = null;
  const writer = createClient("http://127.0.0.1:54321", "test-only", {
    global: { fetch: async (input, init) => {
      if (String(input).includes("read_reporting_search")) return Response.json(sharedResults);
      if (String(input).includes("save_reporting_search")) {
        sharedResults = JSON.parse(String(init?.body)).p_articles;
        return Response.json(null);
      }
      if (String(input).includes("claim_reporting_refresh")) {
        reservations++;
        return Response.json(allowReservation ? "11111111-1111-4111-a111-111111111111" : null);
      }
      finishes++;
      return Response.json(true);
    } },
  });
  globalThis.fetch = async (input) => {
    providerCalls++;
    expect(new URL(String(input)).searchParams.get("country")).toBe("pk");
    return Response.json({ articles: [{ title: "City library opens new study rooms", description: "The new public library opened study rooms and expanded its collection of books for residents across the city on Monday.", url: "https://publisher.org/city-library", source: { name: "Publisher" }, publishedAt: "2026-10-19T10:00:00Z" }] });
  };
  const search = () => executeBoundedTargetedSearch([{ query: "city library", country: "PK" }], {
    reportingWriter: writer, referenceDate: new Date("2026-10-19T12:00:00Z"),
  });
  try {
    process.env.GNEWS_API_KEY = "test-only";
    process.env.GNEWS_COMMERCIAL_APPROVED = "false";
    clearSearchCacheForTesting();
    await search();
    expect(providerCalls).toBe(0);
    expect(reservations).toBe(0);
    process.env.GNEWS_COMMERCIAL_APPROVED = "true";
    clearSearchCacheForTesting();
    await search();
    expect(providerCalls).toBe(0);
    expect(reservations).toBe(1);
    allowReservation = true;
    clearSearchCacheForTesting();
    const result = await search();
    expect(providerCalls).toBe(1);
    process.env.GNEWS_COMMERCIAL_APPROVED = "false";
    const revoked = await search();
    expect(revoked.articlesFound).toEqual([]);
    process.env.GNEWS_COMMERCIAL_APPROVED = "true";
    expect(finishes).toBe(1);
    expect(result.articlesFound[0].raw_data?.output_use).toBe("commercial");
    expect(result.articlesFound[0].locale).toBeNull();
    clearSearchCacheForTesting();
    const anotherInstance = await search();
    expect(anotherInstance.reusedFromCache).toBe(true);
    expect(anotherInstance.searchesExecuted).toBe(0);
    expect(providerCalls).toBe(1);
  } finally {
    globalThis.fetch = originalFetch;
    if (oldKey === undefined) delete process.env.GNEWS_API_KEY; else process.env.GNEWS_API_KEY = oldKey;
    if (oldApproval === undefined) delete process.env.GNEWS_COMMERCIAL_APPROVED; else process.env.GNEWS_COMMERCIAL_APPROVED = oldApproval;
    clearSearchCacheForTesting();
  }
});

test("targeted reporting joins an existing canonical event instead of taking another Story slot", async () => {
  const reader = createClient("http://127.0.0.1:54321", "test-only", {
    global: { fetch: async () => Response.json([]) },
  });
  const source = {
    id: "library", external_id: "wire-library", title: "City opens a public library downtown",
    description: "Residents can borrow books and use study rooms at the new public library downtown, which opened on Monday.",
    snippet: null, url: "https://publisher.org/library", publisher: "City reporting", image_url: null,
    published_at: "2026-10-19T10:00:00Z", language: "en", categories: ["general"], locale: null,
    raw_data: { provider: "thenewsapi", output_use: "commercial" },
  };
  clearSearchCacheForTesting();
  const result = await refineEditionWithTargetedSearch(reader,
    [{ ...source, supportingArticles: [source] }],
    { interests: ["general"], preferred_region: "global", reading_length: 5 },
    new Date("2026-10-19T12:00:00Z"), [], {}, [], {
      explicitSearchRequests: [{ query: "library opening" }],
      customSearchProvider: async () => [{ ...source, id: "alternate", external_id: "alternate", url: `${source.url}?utm_source=wire` }],
    });
  expect([...result.main, ...result.beyondBubble]).toHaveLength(1);
  expect(result.newStoriesDiscovered).toBe(0);
  clearSearchCacheForTesting();
});

test("concurrent live searches reuse the pending shared result and count a failed provider attempt", async () => {
  const oldKey = process.env.GNEWS_API_KEY;
  const oldApproval = process.env.GNEWS_COMMERCIAL_APPROVED;
  const originalFetch = globalThis.fetch;
  let shared: unknown = null;
  let locked = false;
  let providerCalls = 0;
  const writer = createClient("http://127.0.0.1:54321", "test-only", {
    global: { fetch: async (input, init) => {
      if (String(input).includes("read_reporting_search")) return Response.json(shared);
      if (String(input).includes("claim_reporting_refresh")) {
        if (locked) return Response.json(null);
        locked = true;
        return Response.json("11111111-1111-4111-a111-111111111111");
      }
      if (String(input).includes("save_reporting_search")) shared = JSON.parse(String(init?.body)).p_articles;
      if (String(input).includes("finish_reporting_refresh")) locked = false;
      return Response.json(true);
    } },
  });
  globalThis.fetch = async () => {
    providerCalls++;
    await new Promise((resolve) => setTimeout(resolve, 50));
    return Response.json({ articles: [{ title: "City library opens new study rooms", description: "Residents can borrow books and use study rooms at the new public library downtown, which opened on Monday.", url: "https://publisher.org/library", source: { name: "City reporting" }, publishedAt: "2026-10-19T10:00:00Z" }] });
  };
  const search = () => executeBoundedTargetedSearch([{ query: "library study rooms" }], {
    reportingWriter: writer, referenceDate: new Date("2026-10-19T12:00:00Z"),
  });
  try {
    process.env.GNEWS_API_KEY = "test-only";
    process.env.GNEWS_COMMERCIAL_APPROVED = "true";
    const [first, second] = await Promise.all([search(), search()]);
    expect(first.articlesFound).toHaveLength(1);
    expect(second.articlesFound).toEqual(first.articlesFound);
    expect(providerCalls).toBe(1);
    expect(first.searchesExecuted + second.searchesExecuted).toBe(1);
    shared = null;
    globalThis.fetch = async () => { throw new Error("Controlled network failure"); };
    const failed = await search();
    expect(failed.searchesExecuted).toBe(1);
    expect(failed.success).toBe(false);
    expect(locked).toBe(false);
  } finally {
    globalThis.fetch = originalFetch;
    if (oldKey === undefined) delete process.env.GNEWS_API_KEY; else process.env.GNEWS_API_KEY = oldKey;
    if (oldApproval === undefined) delete process.env.GNEWS_COMMERCIAL_APPROVED; else process.env.GNEWS_COMMERCIAL_APPROVED = oldApproval;
  }
});

test("a reservation acquired after another search finishes reuses its shared result", async () => {
  const oldKey = process.env.GNEWS_API_KEY;
  const oldApproval = process.env.GNEWS_COMMERCIAL_APPROVED;
  const originalFetch = globalThis.fetch;
  let reserved = false;
  let finishes = 0;
  let providerCalls = 0;
  const writer = createClient("http://127.0.0.1:54321", "test-only", {
    global: { fetch: async (input) => {
      if (String(input).includes("read_reporting_search")) return Response.json(reserved ? [] : null);
      if (String(input).includes("claim_reporting_refresh")) {
        // Another worker completes the equivalent search between the miss and claim.
        reserved = true;
        return Response.json("11111111-1111-4111-a111-111111111111");
      }
      if (String(input).includes("finish_reporting_refresh")) finishes++;
      return Response.json(true);
    } },
  });
  globalThis.fetch = async () => { providerCalls++; return Response.json({ articles: [] }); };
  try {
    process.env.GNEWS_API_KEY = "test-only";
    process.env.GNEWS_COMMERCIAL_APPROVED = "true";
    const result = await executeBoundedTargetedSearch([{ query: "library study rooms" }], {
      reportingWriter: writer, referenceDate: new Date("2026-10-19T12:00:00Z"),
    });
    expect(providerCalls).toBe(0);
    expect(result.reusedFromCache).toBe(true);
    expect(result.searchesExecuted).toBe(0);
    expect(finishes).toBe(1);
  } finally {
    globalThis.fetch = originalFetch;
    if (oldKey === undefined) delete process.env.GNEWS_API_KEY; else process.env.GNEWS_API_KEY = oldKey;
    if (oldApproval === undefined) delete process.env.GNEWS_COMMERCIAL_APPROVED; else process.env.GNEWS_COMMERCIAL_APPROVED = oldApproval;
  }
});
