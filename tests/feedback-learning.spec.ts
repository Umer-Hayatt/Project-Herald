import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { login, testReadersConfigured } from "./helpers";
import { getOrCreateDailyEdition } from "../src/lib/edition/service";
import type { SourceArticle } from "../src/lib/edition/types";

test("saved Less like this changes the next Edition while the earlier archive and PDF stay identical", async ({ context, page, baseURL }, testInfo) => {
  test.skip(!testReadersConfigured, "Disposable test readers required");
  test.setTimeout(90000);
  const readerA = await login("A", context, baseURL!);
  const readerB = await login("B");
  const userA = (await readerA.auth.getUser()).data.user!;
  const userB = (await readerB.auth.getUser()).data.user!;
  for (const [client, user] of [[readerA, userA], [readerB, userB]] as const) {
    // Reset only this dedicated test project's disposable reader fixtures.
    expect((await client.from("story_feedback").delete().eq("reader_id", user.id)).error).toBeNull();
    expect((await client.from("editions").delete().eq("reader_id", user.id)).error).toBeNull();
    expect((await client.auth.updateUser({ data: { subtopics: [] } })).error).toBeNull();
    expect((await client.from("reader_preferences").upsert({
      reader_id: user.id, interests: ["technology", "science"], preferred_region: "global",
      reading_length: 5, time_zone: "UTC", onboarding_complete: true,
    })).error).toBeNull();
  }
  const source = (id: string, title: string, topic: string, date: string, description: string): SourceArticle => ({
    id, external_id: id, title, description, snippet: null, image_url: null,
    url: `https://publisher.org/${id}`, publisher: "Controlled Reporting", published_at: date,
    language: "en", categories: [topic], locale: null,
    raw_data: { provider: "thenewsapi", output_use: "commercial" },
  });
  const day1Supply = [
    source("compiler", "Open compiler adds support for new processor architecture", "technology", "2026-10-18T11:00:00Z",
      "The compiler project released support for a new processor architecture, with installation instructions and a compatibility list for developers building applications."),
    source("coast", "Researchers publish sediment measurements from coastal survey", "science", "2026-10-18T10:00:00Z",
      "Researchers published sediment measurements collected along the coast and released the sampling methods so other teams can compare observations from different locations."),
  ];
  const day2Supply = [
    source("appointments", "Hospital network deploys new appointment booking system", "technology", "2026-10-19T11:00:00Z",
      "The hospital network introduced an appointment booking system across its clinics and published instructions for patients changing or cancelling their scheduled visits."),
    source("forest", "Forest survey maps previously undocumented tree populations", "science", "2026-10-19T10:00:00Z",
      "A forest survey mapped previously undocumented tree populations and released location summaries and sampling methods for researchers studying habitat distribution across the region."),
  ];
  const day1 = await getOrCreateDailyEdition(readerA, userA.id, {
    controlledDate: "2026-10-18", referenceDate: new Date("2026-10-18T12:00:00Z"), controlledSupply: day1Supply,
  });
  expect(day1.success).toBe(true);
  if (!day1.success) return;
  expect(day1.edition.stories[0].category).toBe("technology");
  const readPdf = async (name: string) => {
    const response = await context.request.get(`/api/editions/${day1.edition.id}/pdf`);
    expect(response.status()).toBe(200);
    const file = testInfo.outputPath(name);
    writeFileSync(file, await response.body());
    return JSON.parse(execFileSync(process.env.HERALD_TEST_PYTHON || "python", [resolve("scripts/inspect-pdf.py"), file], { encoding: "utf8" })) as { full_text: string; links: string[] };
  };
  const originalPdf = await readPdf("before-feedback.pdf");
  const feedback = await context.request.post("/api/feedback", {
    headers: { origin: baseURL! }, data: { story_id: day1.edition.stories[0].id, feedback: "less" },
  });
  expect(feedback.ok()).toBe(true);
  const savedFeedback = await context.request.get(`/api/feedback?story_id=${day1.edition.stories[0].id}`);
  expect(savedFeedback.ok()).toBe(true);
  expect(await savedFeedback.json()).toEqual({ feedback: "less" });
  const nextOptions = { controlledDate: "2026-10-19", referenceDate: new Date("2026-10-19T12:00:00Z"), controlledSupply: day2Supply };
  const nextA = await getOrCreateDailyEdition(readerA, userA.id, nextOptions);
  const nextB = await getOrCreateDailyEdition(readerB, userB.id, nextOptions);
  expect(nextA.success).toBe(true);
  expect(nextB.success).toBe(true);
  if (!nextA.success || !nextB.success) return;
  expect(nextA.edition.stories[0].category).toBe("science");
  expect(nextB.edition.stories[0].category).toBe("technology");
  const preserved = await getOrCreateDailyEdition(readerA, userA.id, { controlledDate: "2026-10-18", controlledSupply: [] });
  expect(preserved.success).toBe(true);
  if (preserved.success) expect(preserved.edition).toEqual(day1.edition);
  await page.goto(`/archive/${day1.edition.id}`);
  await expect(page.locator(".story-title")).toHaveText(day1.edition.stories.map(story => story.title));
  await expect(page.locator(".story-briefing")).toHaveText(day1.edition.stories.map(story => story.briefing || story.excerpt));
  const preservedPdf = await readPdf("after-feedback.pdf");
  expect(preservedPdf).toEqual(originalPdf);
  for (const story of day1.edition.stories) {
    expect(preservedPdf.full_text).toContain(story.title);
    expect(preservedPdf.links).toContain(story.source_url);
  }
});
