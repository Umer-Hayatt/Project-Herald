import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

test("private daily coverage records eligible candidates, failures and unique stories without claiming approval", () => {
  const directory = mkdtempSync(join(tmpdir(), "herald-coverage-"));
  const mock = join(directory, "provider.mjs");
  writeFileSync(mock, `
const now = new Date().toISOString();
const reports = [
  { uuid: "ocean-1", title: "University researchers map distant ocean currents", description: "University researchers published new ocean current measurements after a year of field observations and shared the mapped findings with coastal scientists.", url: "https://publisher-a.org/reports/ocean-current-map", source: "Publisher A" },
  { uuid: "battery-2", title: "City laboratory starts new solar battery trial", description: "A city laboratory began a solar battery trial in Pakistan with university engineers and will publish measured results after the first testing phase.", url: "https://publisher-b.org/reports/solar-battery-trial", source: "Publisher B" },
  { uuid: "glacier-3", title: "National institute publishes new glacier measurements", description: "The national institute published glacier measurements from its latest expedition and described how researchers will use the data to track seasonal changes.", url: "https://publisher-a.org/reports/glacier-measurements", source: "Publisher A" },
].map(report => ({ ...report, published_at: now, language: "en", categories: ["science"] }));
globalThis.fetch = async input => {
  const url = new URL(String(input));
  if (url.searchParams.get("limit") !== "3") return new Response("", { status: 400 });
  if (url.searchParams.get("categories") === "health") return Response.json({ meta: {} });
  if (["science", "tech"].includes(url.searchParams.get("categories"))) {
    return new Response(JSON.stringify({ data: reports }), { status: 200, headers: { "x-ratelimit-remaining": "90" } });
  }
  return new Response("", { status: 429 });
};
`);
  try {
    const script = resolve("scripts/record-daily-coverage.mjs");
    const run = () => execFileSync(process.execPath, ["--import", pathToFileURL(mock).href, script], {
      cwd: directory,
      env: { ...process.env, THENEWSAPI_TOKEN: "test-token" },
      encoding: "utf8",
    });
    run();
    run();
    const files = readdirSync(join(directory, "tmp/daily-coverage")).filter(name => name.endsWith(".json"));
    expect(files).toHaveLength(2);
    const report = JSON.parse(readFileSync(join(directory, "tmp/daily-coverage", files[0]), "utf8"));
    expect(report.outputUse).toBe("evaluation_only");
    expect(report.interests.science.eligibleCount).toBe(3);
    expect(report.interests.science.candidateGate).toBe(true);
    expect(report.interests.science.status).toBe("needs_review");
    expect(report.interests.general.error).toBe("HTTP 429");
    expect(report.interests.health.error).toBe("invalid_response");
    expect(report.regionalCoverage.global.articleCount).toBe(3);
    expect(report.regionalCoverage.global.storyCount).toBe(3);
    expect(report.regionalCoverage.pk.status).toBe("needs_review");
    expect(report.regionalCoverage.pk.candidateArticleCount).toBe(1);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
