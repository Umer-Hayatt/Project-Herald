import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { registerHooks, stripTypeScriptTypes } from "node:module";
import { join } from "node:path";

// Keep native Node TypeScript resolution local to these source-module imports.
const sourceRoot = new URL("../src/lib/edition/", import.meta.url).href;
const hook = registerHooks({ resolve(specifier, context, nextResolve) {
  if (/^\.\.?\//.test(specifier) && context.parentURL?.startsWith(sourceRoot) &&
    context.parentURL.endsWith(".ts") && !/\.[a-z]+$/i.test(specifier)) {
    return nextResolve(specifier + ".ts", context);
  }
  return nextResolve(specifier, context);
}, load(url, context, nextLoad) {
  if (url.startsWith(sourceRoot) && url.endsWith(".ts")) {
    return { format: "module", shortCircuit: true,
      source: stripTypeScriptTypes(readFileSync(new URL(url), "utf8"), { mode: "transform" }) };
  }
  return nextLoad(url, context);
} });
let NewsProviderCoordinator, GlobalVoicesAdapter, filterEligibleArticles, groupSourceArticles;
try {
  ({ NewsProviderCoordinator } = await import("../src/lib/edition/providers/coordinator.ts"));
  ({ GlobalVoicesAdapter } = await import("../src/lib/edition/providers/globalvoices.ts"));
  ({ filterEligibleArticles } = await import("../src/lib/edition/content-quality.ts"));
  ({ groupSourceArticles } = await import("../src/lib/edition/grouping.ts"));
} finally { hook.deregister(); }

if (process.env.GLOBALVOICES_ENABLED !== "true") {
  throw new Error("Explicit GLOBALVOICES_ENABLED=true is required for a live observation");
}
const now = new Date();
const timeZone = "Asia/Karachi";
const sampleDate = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
// Explicit adapter list prevents inherited keys from calling other providers.
const result = await new NewsProviderCoordinator([new GlobalVoicesAdapter()]).fetchAll({ now });
const eligible = filterEligibleArticles(result.articles, { now, requireCurrentProviderApproval: true });
const failed = result.errors.length > 0;
const topicCounts = {};
for (const article of eligible) for (const topic of new Set(article.categories)) {
  topicCounts[topic] = (topicCounts[topic] || 0) + 1;
}
const report = {
  sampleDate, timeZone, sampledAt: now.toISOString(), provider: "Global Voices",
  publicApproval: process.env.GLOBALVOICES_PUBLIC_REPORTING_ENABLED === "true",
  providerCalls: result.providerCalls, acceptedCandidates: result.articles.length,
  eligiblePublicCandidates: eligible.length, uniqueStories: groupSourceArticles(eligible).length,
  topicCounts, providerFailures: result.errors.map(error => ({ provider: error.provider, status: "failed" })),
  status: failed ? "provider_unavailable" : eligible.length ? "supplementary_observation_unreviewed" : "no_eligible_reporting",
  threeDayAcceptance: "not_established", databaseWrites: false, modelCalls: 0,
  sources: eligible.map(article => ({ url: article.url, publishedAt: article.published_at,
    license: article.raw_data.source_attribution.license,
    authors: article.raw_data.source_attribution.authors,
    words: (article.snippet || article.description || "").split(/\s+/).filter(Boolean).length })),
};
const directory = join("tmp", "daily-coverage");
mkdirSync(directory, { recursive: true });
const path = join(directory, `${sampleDate}-globalvoices-${randomUUID()}.json`);
writeFileSync(path, JSON.stringify(report, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify({ path, sampleDate, eligible: eligible.length, status: report.status }));
if (failed) process.exitCode = 1;
