import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { assertIsolatedTestEnvironment } from "./isolation";

test("excluded newest source rows do not hide eligible public reporting", async ({ page }) => {
  test.setTimeout(90000);
  assertIsolatedTestEnvironment(process.env);
  const key = process.env.SUPABASE_REPORTING_SERVICE_KEY;
  expect(key, "Configure the isolated project's reporting service key").toBeTruthy();
  if (!key) return;
  const server = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const nonce = randomUUID();
  const now = Date.now();
  const title = `Coastal research institute opens public ocean laboratory ${nonce}`;
  const base = {
    description: "The coastal research institute opened a public ocean laboratory with new testing equipment and weekly sessions for local university researchers.",
    snippet: null, image_url: null, publisher: "Coastal Research Reporting",
    language: "en", categories: ["science"], locale: null,
    raw_data: { provider: "thenewsapi", output_use: "commercial" },
  };
  const excluded = Array.from({ length: 40 }, (_, i) => ({
    ...base, external_id: `public-excluded-${nonce}-${i}`,
    title: `Excluded source fixture ${nonce} laboratory report ${i}`,
    url: `https://fixture.example.org/${nonce}/report-${i}`,
    published_at: new Date(now + 120000 + i).toISOString(),
  }));
  const eligible = {
    ...base, external_id: `public-eligible-${nonce}`, title,
    url: `https://publisher.org/reports/coastal-laboratory-${nonce}`,
    published_at: new Date(now + 60000).toISOString(),
  };
  const ids = [...excluded, eligible].map(row => row.external_id);
  try {
    expect((await server.from("source_articles").insert([...excluded, eligible])).error).toBeNull();
    await page.goto("/");
    await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
    await expect(page.getByText(`Excluded source fixture ${nonce}`, { exact: false })).toHaveCount(0);
  } finally {
    expect((await server.from("source_articles").delete().in("external_id", ids)).error).toBeNull();
  }
});
