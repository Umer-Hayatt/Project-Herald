import { test, expect } from "@playwright/test";
import { login, testReadersConfigured } from "./helpers";
import { assertIsolatedTestEnvironment } from "./isolation";
import { NewsProviderCoordinator } from "../src/lib/edition/providers/coordinator";
import { getOrCreateDailyEdition } from "../src/lib/edition/service";
import { getArchivedEditionById } from "../src/lib/edition/archive";
import { generateEditionPdf } from "../src/lib/edition/pdf";
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

test("licensed reporting retains creator credit and licence across saved reading and PDF", async ({ context, page, baseURL }, testInfo) => {
  assertIsolatedTestEnvironment(process.env);
  test.skip(!testReadersConfigured, "Disposable isolated readers required");
  test.setTimeout(90000);
  const reader = await login("A", context, baseURL!);
  const readerId = (await reader.auth.getUser()).data.user!.id;
  const date = "2026-08-17";
  const sourceUrl = "https://globalvoices.org/2026/08/17/controlled-accessibility-report";
  const attribution = { authors: ["Controlled Author"], license: "CC BY 3.0", license_url: "https://creativecommons.org/licenses/by/3.0/" };
  const coordinator = new NewsProviderCoordinator([{
    name: "globalvoices", defaultOutputUse: "commercial", isConfigured: () => true,
    fetchCandidates: async () => ({ success: true, providerCalls: 1, candidates: [{
      id: "controlled-licensed-report", title: "City councillors publish new bus accessibility plans",
      description: "City councillors published new accessibility plans for local bus routes after a public consultation. The plans describe improved boarding areas and clearer route information for passengers, with a published timetable for reviewing the proposals.",
      snippet: null, url: sourceUrl, image_url: null, publisher: "Global Voices",
      published_at: date + "T08:00:00Z", retrieved_at: date + "T12:00:00Z", language: "en",
      categories: ["general"], locale: null, provider: "globalvoices", output_use: "commercial",
      raw: { source_attribution: attribution },
    }] }),
  }]);
  let editionId: string | undefined;
  try {
    const supply = await coordinator.fetchAll({ now: new Date(date + "T12:00:00Z") });
    const result = await getOrCreateDailyEdition(reader, readerId, {
      controlledDate: date, referenceDate: new Date(date + "T12:00:00Z"), controlledSupply: supply.articles,
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    editionId = result.edition.id;
    expect(result.edition.stories[0].supporting_sources?.[0]).toMatchObject({ attribution });
    const archived = await getArchivedEditionById(reader, readerId, editionId);
    expect(archived).not.toBeNull();
    if (!archived) return;
    await page.goto(`/archive/${editionId}`);
    const credit = page.locator(".source-attribution").first();
    await expect(credit).toContainText("Controlled Author");
    await expect(credit.getByRole("link", { name: "CC BY 3.0" })).toHaveAttribute("href", attribution.license_url);
    await expect(credit.getByRole("link", { name: "Global Voices" })).toHaveAttribute("href", sourceUrl);
    await expect(credit).toContainText("Excerpted or adapted");
    const file = testInfo.outputPath("licensed-report.pdf");
    writeFileSync(file, await generateEditionPdf(archived));
    const pdf = JSON.parse(execFileSync(process.env.HERALD_TEST_PYTHON || "python", [resolve("scripts/inspect-pdf.py"), file], { encoding: "utf8" }));
    expect(pdf.full_text).toContain("Controlled Author");
    expect(pdf.full_text).toContain("CC BY 3.0");
    expect(JSON.stringify(pdf)).toContain(attribution.license_url);
    const preserved = await getOrCreateDailyEdition(reader, readerId, { controlledDate: date, controlledSupply: [] });
    expect(preserved.success && preserved.edition).toEqual(result.edition);
  } finally {
    if (editionId) expect((await reader.from("editions").delete().eq("id", editionId).eq("reader_id", readerId)).error).toBeNull();
  }
});
