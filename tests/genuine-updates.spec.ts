import { test, expect } from "@playwright/test";
import { login, testReadersConfigured } from "./helpers";
import { getOrCreateDailyEdition } from "../src/lib/edition/service";
import { getArchivedEditionById } from "../src/lib/edition/archive";
import { generateEditionPdf } from "../src/lib/edition/pdf";
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { SourceArticle } from "../src/lib/edition/types";

test("a next-day publisher decision becomes an explained update without provider verification flags", async ({ page, context, baseURL }, testInfo) => {
  test.skip(!testReadersConfigured, "Disposable isolated readers required");
  test.setTimeout(90000);
  const reader = await login("A", context, baseURL!);
  const readerId = (await reader.auth.getUser()).data.user!.id;
  const dates = ["2026-10-20", "2026-10-21", "2026-10-22"];
  expect((await reader.from("editions").delete().eq("reader_id", readerId).in("edition_date", dates)).error).toBeNull();
  expect((await reader.from("reader_preferences").upsert({
    reader_id: readerId, interests: ["science"], preferred_region: "global",
    reading_length: 5, time_zone: "UTC", onboarding_complete: true,
  })).error).toBeNull();
  const before = "The European Commission proposed funding for solar summit grid upgrades.";
  const after = "The European Commission approved funding for solar summit grid upgrades.";
  const source = (text: string, date: string): SourceArticle => ({
    id: `solar-funding-${date}`, external_id: `solar-funding-${date}`,
    title: "European Commission considers solar summit grid funding programme",
    description: text, snippet: null, image_url: null,
    url: "https://publisher.org/genuine-update-solar-funding", publisher: "Controlled Policy Reporting",
    published_at: `${date}T08:00:00Z`, language: "en", categories: ["science"], locale: null,
    raw_data: { provider: "thenewsapi", output_use: "commercial" },
  });
  try {
    const first = await getOrCreateDailyEdition(reader, readerId, {
      controlledDate: dates[0], referenceDate: new Date(`${dates[0]}T12:00:00Z`), controlledSupply: [source(before, dates[0])],
    });
    expect(first.success).toBe(true);
    if (!first.success) return;
    const next = await getOrCreateDailyEdition(reader, readerId, {
      controlledDate: dates[1], referenceDate: new Date(`${dates[1]}T12:00:00Z`), controlledSupply: [source(after, dates[1])],
    });
    expect(next.success).toBe(true);
    if (!next.success) return;
    expect(next.edition.stories[0].is_update).toBe(true);
    expect(next.edition.stories[0].update_explanation).toContain(before);
    expect(next.edition.stories[0].update_explanation).toContain(after);
    const archived = await getArchivedEditionById(reader, readerId, next.edition.id);
    expect(archived?.stories[0].update_explanation).toBe(next.edition.stories[0].update_explanation);
    expect(archived).not.toBeNull();
    if (!archived) return;
    const pdfFile = testInfo.outputPath("decision-update.pdf");
    writeFileSync(pdfFile, await generateEditionPdf(archived));
    const pdf = JSON.parse(execFileSync(process.env.HERALD_TEST_PYTHON || "python", [resolve("scripts/inspect-pdf.py"), pdfFile], { encoding: "utf8" }));
    expect(pdf.full_text.replace(/\s+/g, " ")).toContain(next.edition.stories[0].update_explanation);
    expect(next.edition.stories[0].word_count).toBe(43);
    await page.goto(`/archive/${next.edition.id}`);
    await expect(page.locator(".story-update-explanation")).toContainText(next.edition.stories[0].update_explanation!);
    const repeated = await getOrCreateDailyEdition(reader, readerId, {
      controlledDate: dates[2], referenceDate: new Date(`${dates[2]}T12:00:00Z`), controlledSupply: [source(after, dates[2])],
    });
    expect(repeated.success).toBe(true);
    if (repeated.success) expect(repeated.edition.stories[0].is_update).toBe(false);
    const preserved = await getOrCreateDailyEdition(reader, readerId, { controlledDate: dates[0], controlledSupply: [] });
    expect(preserved.success).toBe(true);
    if (preserved.success) expect(preserved.edition).toEqual(first.edition);
  } finally {
    expect((await reader.from("editions").delete().eq("reader_id", readerId).in("edition_date", dates)).error).toBeNull();
  }
});

test("an intervening publisher does not hide an earlier comparable source decision", async ({ context, baseURL }) => {
  test.skip(!testReadersConfigured, "Disposable isolated readers required");
  test.setTimeout(90000);
  const reader = await login("A", context, baseURL!);
  const readerId = (await reader.auth.getUser()).data.user!.id;
  const dates = ["2026-10-30", "2026-10-31", "2026-11-01"];
  const title = "European Commission coastal research pier funding decision";
  const before = "The European Commission proposed funding for coastal research pier upgrades.";
  const after = "The European Commission approved funding for coastal research pier upgrades.";
  const source = (publisher: "a" | "b", text: string, date: string): SourceArticle => ({
    id: `coastal-pier-${publisher}-${date}`,
    external_id: `coastal-pier-${publisher}-${date}`,
    title,
    description: text,
    snippet: null,
    image_url: null,
    url: `https://publisher-${publisher}.org/coastal-pier-funding`,
    publisher: `Publisher ${publisher.toUpperCase()}`,
    published_at: `${date}T08:00:00Z`,
    language: "en",
    categories: ["science"],
    locale: null,
    raw_data: { provider: "thenewsapi", output_use: "commercial" },
  });
  expect((await reader.from("editions").delete().eq("reader_id", readerId).in("edition_date", dates)).error).toBeNull();
  expect((await reader.from("reader_preferences").upsert({
    reader_id: readerId, interests: ["science"], preferred_region: "global",
    reading_length: 5, time_zone: "UTC", onboarding_complete: true,
  })).error).toBeNull();
  try {
    const first = await getOrCreateDailyEdition(reader, readerId, {
      controlledDate: dates[0], referenceDate: new Date(`${dates[0]}T12:00:00Z`),
      controlledSupply: [source("a", before, dates[0])],
    });
    expect(first.success).toBe(true);
    if (!first.success) return;
    const repeated = await getOrCreateDailyEdition(reader, readerId, {
      controlledDate: dates[1], referenceDate: new Date(`${dates[1]}T12:00:00Z`),
      controlledSupply: [source("b", before, dates[1])],
    });
    expect(repeated.success).toBe(true);
    if (!repeated.success) return;
    expect(repeated.edition.stories[0].is_update).toBe(false);
    const decision = await getOrCreateDailyEdition(reader, readerId, {
      controlledDate: dates[2], referenceDate: new Date(`${dates[2]}T12:00:00Z`),
      controlledSupply: [source("a", after, dates[2])],
    });
    expect(decision.success).toBe(true);
    if (!decision.success) return;
    expect(decision.edition.stories[0].is_update).toBe(true);
    expect(decision.edition.stories[0].update_explanation).toContain(before);
    expect(decision.edition.stories[0].update_explanation).toContain(after);
    const archived = await getArchivedEditionById(reader, readerId, decision.edition.id);
    expect(archived?.stories[0].update_explanation).toBe(decision.edition.stories[0].update_explanation);
    const preservedFirst = await getOrCreateDailyEdition(reader, readerId, { controlledDate: dates[0], controlledSupply: [] });
    expect(preservedFirst.success).toBe(true);
    if (preservedFirst.success) expect(preservedFirst.edition).toEqual(first.edition);
    const preservedRepeat = await getOrCreateDailyEdition(reader, readerId, { controlledDate: dates[1], controlledSupply: [] });
    expect(preservedRepeat.success).toBe(true);
    if (preservedRepeat.success) expect(preservedRepeat.edition).toEqual(repeated.edition);
  } finally {
    expect((await reader.from("editions").delete().eq("reader_id", readerId).in("edition_date", dates)).error).toBeNull();
  }
});
