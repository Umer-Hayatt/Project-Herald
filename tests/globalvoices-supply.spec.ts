import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { login, testReadersConfigured } from "./helpers";
import { assertIsolatedTestEnvironment } from "./isolation";
import { getReportingSupply } from "../src/lib/edition/news-supply";
import { getOrCreateDailyEdition } from "../src/lib/edition/service";
import { getArchivedEditionById } from "../src/lib/edition/archive";
import { generateEditionPdf } from "../src/lib/edition/pdf";
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { NewsProviderCoordinator } from "../src/lib/edition/providers/coordinator";

test("licensed supplementary feed crosses trusted ingestion and retains credits in saved reading", async ({ context, page, baseURL }, testInfo) => {
  assertIsolatedTestEnvironment(process.env);
  test.skip(!testReadersConfigured, "Disposable isolated readers required");
  test.setTimeout(120000);
  const reader = await login("A", context, baseURL!);
  const readerId = (await reader.auth.getUser()).data.user!.id;
  expect(process.env.SUPABASE_REPORTING_SERVICE_KEY).toBeTruthy();
  const server = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_REPORTING_SERVICE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const previousMeta = await server.from("reporting_cache_meta").select("*").eq("id", "news_supply").maybeSingle();
  expect(previousMeta.error).toBeNull();
  const now = new Date();
  const sourceUrl = "https://globalvoices.org/2026/10/23/controlled-supplementary-library-report/";
  const title = "Local residents publish new plans for community library access";
  const body = "Local residents published plans for community library access after a public consultation. The report describes longer opening hours and additional study spaces. Council members will review the proposals at their next public meeting. ".repeat(4).trim();
  const item = (slug: string, author: string, text = body) => `<item><title>${title}</title><link>https://globalvoices.org/2026/10/23/${slug}/</link><dc:creator><![CDATA[${author}]]></dc:creator><pubDate>${now.toUTCString()}</pubDate><category>Education</category><description><![CDATA[${body}]]></description><content:encoded><![CDATA[<p class='originally-published'><small>Originally published on <a href='https://globalvoices.org/2026/10/23/${slug}/'>Global Voices</a></small></p><figure><img src="https://third-party.invalid/photo.jpg"/><figcaption>Third-party photo caption</figcaption></figure><p>${text}</p>]]></content:encoded></item>`;
  const feed = `<?xml version="1.0"?><rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><title>Global Voices</title><language>en-US</language>${item("controlled-supplementary-library-report", "Controlled Author")}${item("controlled-ambiguous-credit", "Guest Contributor")}${item("controlled-restricted-report", "Controlled Author", "Originally published by another publisher. All rights reserved.")}${item("controlled-formatted-restriction", "Controlled Author", `${body} Originally <em>published</em> elsewhere. All&nbsp;rights reserved.`)}${item("controlled-quoted-restriction", "Controlled Author", `<blockquote>This article is copyright its author. All rights reserved.</blockquote>${body}`)}</channel></rss>`;
  const originalFetch = globalThis.fetch;
  const flags = ["GLOBALVOICES_ENABLED", "GLOBALVOICES_PUBLIC_REPORTING_ENABLED"];
  const previousFlags = flags.map(name => process.env[name]);
  let calls = 0;
  let editionId: string | undefined;
  globalThis.fetch = async (input, init) => {
    if (String(input) === "https://globalvoices.org/feed/") {
      calls++;
      return new Response(feed, { headers: { "content-type": "application/rss+xml" } });
    }
    return originalFetch(input, init);
  };
  flags.forEach(name => { process.env[name] = "true"; });
  try {
    expect((await server.from("reporting_cache_meta").delete().eq("id", "news_supply")).error).toBeNull();
    const supply = await getReportingSupply(reader, { referenceDate: now, reportingWriter: server, forceRefresh: true });
    const licensed = supply.filter(article => article.raw_data?.provider === "globalvoices");
    expect(licensed).toHaveLength(1);
    expect(licensed[0].image_url).toBeNull();
    expect(licensed[0].description).not.toContain("Third-party photo caption");
    expect(licensed[0].raw_data?.source_attribution).toMatchObject({ authors: ["Controlled Author"], license: "CC BY 3.0" });
    expect(calls).toBe(1);
    await page.goto("/");
    const publicStory = page.getByRole("article").filter({ has: page.getByRole("heading", { name: title, exact: true }) });
    await expect(publicStory.locator(".source-attribution")).toContainText("Controlled Author");
    await expect(publicStory.getByRole("link", { name: "CC BY 3.0", exact: true })).toHaveAttribute("href", "https://creativecommons.org/licenses/by/3.0/");
    const excerpt = await publicStory.locator(".hero-excerpt, .story-excerpt, .spotlight-excerpt").innerText();
    expect(excerpt.length).toBeLessThanOrEqual(281);
    expect(excerpt).toMatch(/…$/);
    expect((licensed[0].snippet || licensed[0].description)!.length).toBeGreaterThan(281);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await publicStory.screenshot({ path: testInfo.outputPath("supplementary-public-credit.png") });
    const result = await getOrCreateDailyEdition(reader, readerId, { controlledDate: "2026-08-18", referenceDate: now, reportingWriter: server });
    expect(result.success).toBe(true);
    if (!result.success) return;
    editionId = result.edition.id;
    expect(result.edition.stories.some(story => story.source_article_id === licensed[0].id)).toBe(true);
    await page.goto(`/archive/${editionId}`);
    await expect(page.locator(".source-attribution").filter({ hasText: "Controlled Author" })).toBeVisible();
    await page.locator("article").filter({ hasText: "Controlled Author" }).first().screenshot({ path: testInfo.outputPath("supplementary-saved-credit.png") });
    const archived = await getArchivedEditionById(reader, readerId, editionId);
    expect(archived).not.toBeNull();
    if (!archived) return;
    const pdfPath = testInfo.outputPath("supplementary-source.pdf");
    writeFileSync(pdfPath, await generateEditionPdf(archived));
    const pdf = JSON.parse(execFileSync(process.env.HERALD_TEST_PYTHON || "python", [resolve("scripts/inspect-pdf.py"), pdfPath], { encoding: "utf8" }));
    expect(pdf.full_text).toContain("Controlled Author");
    expect(pdf.links).toContain("https://creativecommons.org/licenses/by/3.0/");
    process.env.GLOBALVOICES_PUBLIC_REPORTING_ENABLED = "false";
    expect((await getReportingSupply(reader, { referenceDate: now })).some(article => article.id === licensed[0].id)).toBe(false);
    process.env.GLOBALVOICES_PUBLIC_REPORTING_ENABLED = "true";
    expect((await server.from("source_articles").update({ raw_data: { provider: "globalvoices", output_use: "commercial" } }).eq("id", licensed[0].id)).error).toBeNull();
    expect((await getReportingSupply(reader, { referenceDate: now })).some(article => article.id === licensed[0].id)).toBe(false);
    expect(await getArchivedEditionById(reader, readerId, editionId)).toEqual(archived);
    expect(calls).toBe(1);
  } finally {
    globalThis.fetch = originalFetch;
    flags.forEach((name, index) => { if (previousFlags[index] === undefined) delete process.env[name]; else process.env[name] = previousFlags[index]; });
    if (editionId) expect((await reader.from("editions").delete().eq("id", editionId).eq("reader_id", readerId)).error).toBeNull();
    const fixtureUrls = [sourceUrl, ...["controlled-ambiguous-credit", "controlled-restricted-report", "controlled-formatted-restriction", "controlled-quoted-restriction"].map(slug => `https://globalvoices.org/2026/10/23/${slug}/`)];
    expect((await server.from("source_articles").delete().in("url", fixtureUrls.flatMap(url => [url, url.replace(/\/$/, "")]))).error).toBeNull();
    expect((await server.from("reporting_cache_meta").delete().eq("id", "news_supply")).error).toBeNull();
    if (previousMeta.data) expect((await server.from("reporting_cache_meta").insert(previousMeta.data)).error).toBeNull();
  }
});

test("supplementary fetching stays opt-in and rejects unavailable or unsafe feeds", async () => {
  const originalFetch = globalThis.fetch;
  const enabled = process.env.GLOBALVOICES_ENABLED;
  let calls = 0;
  let response = () => new Response("unavailable", { status: 503 });
  globalThis.fetch = async (input, init) => {
    if (String(input) !== "https://globalvoices.org/feed/") return originalFetch(input, init);
    calls++;
    return response();
  };
  try {
    process.env.GLOBALVOICES_ENABLED = "false";
    expect((await new NewsProviderCoordinator().fetchAll()).articles).toEqual([]);
    expect(calls).toBe(0);
    process.env.GLOBALVOICES_ENABLED = "true";
    for (const failure of [
      () => new Response("unavailable", { status: 503 }),
      () => new Response('<!DOCTYPE rss [<!ENTITY x SYSTEM "file:///private">]><rss version="2.0"><channel><language>en-US</language></channel></rss>'),
      () => new Response("x".repeat(1024 * 1024 + 1)),
      () => new Response('<rss version="2.0"><channel><language>en-US</language>' + "<item>".repeat(51) + "</channel></rss>"),
    ]) {
      response = failure;
      const result = await new NewsProviderCoordinator().fetchAll();
      expect(result.success).toBe(false);
      expect(result.articles).toEqual([]);
      expect(result.errors).toContainEqual({ provider: "globalvoices", message: "Global Voices feed unavailable or unsupported" });
    }
    expect(calls).toBe(4);
  } finally {
    globalThis.fetch = originalFetch;
    if (enabled === undefined) delete process.env.GLOBALVOICES_ENABLED; else process.env.GLOBALVOICES_ENABLED = enabled;
  }
});

test("public refresh never calls an unapproved provider configured alongside the licensed feed", async ({ context, baseURL }) => {
  assertIsolatedTestEnvironment(process.env);
  const reader = await login("A", context, baseURL!);
  const server = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_REPORTING_SERVICE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const previousMeta = await server.from("reporting_cache_meta").select("*").eq("id", "news_supply").maybeSingle();
  expect(previousMeta.error).toBeNull();
  const flags = { GLOBALVOICES_ENABLED: "true", GLOBALVOICES_PUBLIC_REPORTING_ENABLED: "true",
    THENEWSAPI_TOKEN: "controlled-unapproved-token", THENEWSAPI_COMMERCIAL_APPROVED: "false" };
  const previousFlags = Object.fromEntries(Object.keys(flags).map(name => [name, process.env[name]]));
  const originalFetch = globalThis.fetch;
  const now = new Date();
  const slug = "controlled-approved-refresh-budget";
  const externalId = `gv:/2026/10/24/${slug}/`;
  let feedCalls = 0;
  let unapprovedCalls = 0;
  globalThis.fetch = async (input, init) => {
    if (String(input) === "https://globalvoices.org/feed/") {
      feedCalls++;
      return new Response(`<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><language>en</language><item><title>Residents publish new plans for community library access</title><link>https://globalvoices.org/2026/10/24/${slug}/</link><dc:creator>Controlled Author</dc:creator><pubDate>${now.toUTCString()}</pubDate><content:encoded><![CDATA[<p>Residents published new plans for community library access after a public consultation. Council members will review longer opening hours and additional study spaces at their next public meeting.</p>]]></content:encoded></item></channel></rss>`, { headers: { "content-type": "application/rss+xml" } });
    }
    if (String(input).startsWith("https://api.thenewsapi.com/")) {
      unapprovedCalls++;
      return Response.json({ data: [] });
    }
    return originalFetch(input, init);
  };
  Object.assign(process.env, flags);
  try {
    expect((await server.from("reporting_cache_meta").delete().eq("id", "news_supply")).error).toBeNull();
    const supply = await getReportingSupply(reader, { referenceDate: now, reportingWriter: server, forceRefresh: true });
    expect(supply.some(article => article.external_id === externalId)).toBe(true);
    expect(feedCalls).toBe(1);
    expect(unapprovedCalls).toBe(0);
    for (let refresh = 0; refresh < 3; refresh++) {
      await getReportingSupply(reader, { referenceDate: now, reportingWriter: server, forceRefresh: true });
    }
    expect(feedCalls).toBe(4);
    expect(unapprovedCalls).toBe(0);
  } finally {
    globalThis.fetch = originalFetch;
    for (const [name, value] of Object.entries(previousFlags)) {
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
    expect((await server.from("source_articles").delete().eq("external_id", externalId)).error).toBeNull();
    expect((await server.from("reporting_cache_meta").delete().eq("id", "news_supply")).error).toBeNull();
    if (previousMeta.data) expect((await server.from("reporting_cache_meta").insert(previousMeta.data)).error).toBeNull();
  }
});

