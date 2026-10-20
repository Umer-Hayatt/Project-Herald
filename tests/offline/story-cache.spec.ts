import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { processGroupedStories } from "../../src/lib/edition/story-processing";
import type { GroupedSourceArticle } from "../../src/lib/edition/types";

test("legacy reader cache is rejected, then server-generated reporting is persisted and reused", async () => {
  const originalFetch = globalThis.fetch;
  const envNames = ["GEMINI_PUBLIC_BRIEFINGS_ENABLED", "GEMINI_API_KEY", "GEMINI_MODEL"] as const;
  const oldEnvironment = envNames.map((name) => process.env[name]);
  const payload = {
    briefing: "Researchers tested a solar powered computer chip.",
    why_it_matters: "The chip reduced energy use in laboratory tests.",
    topics: ["technology"], source: "gemini",
  };
  const article = {
    id: "solar-chip", external_id: "solar-chip", title: "New solar chip improves computer efficiency",
    description: payload.briefing, snippet: payload.why_it_matters,
    url: "https://publisher.org/solar-chip", image_url: null, publisher: "Science reporting",
    published_at: "2026-10-19T10:00:00Z", language: "en", categories: ["technology"], locale: null,
  };
  const story: GroupedSourceArticle = { ...article, supportingArticles: [article] };
  let trusted = false;
  let writes = 0;
  let modelCalls = 0;
  const reader = createClient("http://127.0.0.1:54321", "test-reader", {
    global: { fetch: async (input, init) => {
      expect(init?.method || "GET").toBe("GET");
      const url = new URL(String(input));
      const key = url.searchParams.get("cache_key")!.slice(4, -1);
      // Return the legacy row even if the query filters it: the consumer must check trust too.
      return Response.json([{ cache_key: key, payload, trusted_server: trusted }]);
    } },
  });
  const server = createClient("http://127.0.0.1:54321", "test-server", {
    global: { fetch: async (input, init) => {
      expect(String(input)).toContain("/rpc/save_processed_stories");
      expect(JSON.parse(String(init?.body)).p_stories[0].payload).toEqual(payload);
      trusted = true;
      writes++;
      return Response.json(null);
    } },
  });
  globalThis.fetch = async (_input, init) => {
    modelCalls++;
    const request = JSON.parse(String(init?.body));
    const input = JSON.parse(request.contents[0].parts[0].text).stories[0];
    return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({ stories: [{
      id: input.id, briefing: payload.briefing, why_it_matters: payload.why_it_matters,
      topics: payload.topics, source_ids: [article.id],
    }] }) }] } }] });
  };
  try {
    process.env.GEMINI_PUBLIC_BRIEFINGS_ENABLED = "false";
    expect((await processGroupedStories(reader, [story])).get(article.id)?.source).toBe("publisher_excerpt");
    process.env.GEMINI_PUBLIC_BRIEFINGS_ENABLED = "true";
    process.env.GEMINI_API_KEY = "test-only";
    process.env.GEMINI_MODEL = "test-only";
    const generated = await processGroupedStories(reader, [story], server);
    expect(generated.get(article.id)?.source).toBe("gemini");
    expect(writes).toBe(1);
    const reused = await processGroupedStories(reader, [story]);
    expect(reused.get(article.id)).toEqual(generated.get(article.id));
    expect(modelCalls).toBe(1);
  } finally {
    globalThis.fetch = originalFetch;
    envNames.forEach((name, index) => {
      if (oldEnvironment[index] === undefined) delete process.env[name];
      else process.env[name] = oldEnvironment[index];
    });
  }
});
