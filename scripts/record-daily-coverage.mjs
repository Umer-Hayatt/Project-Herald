import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { evaluateArticleQuality } from "../src/lib/edition/content-quality.ts";
import { extractEventGeography } from "../src/lib/edition/geography.ts";
import { canonicalizeSourceUrl, groupSourceArticles } from "../src/lib/edition/grouping.ts";

const env = existsSync(".env.local") ? readFileSync(".env.local", "utf8") : "";
const token = process.env.THENEWSAPI_TOKEN?.trim() || env.match(/^THENEWSAPI_TOKEN=(.+)$/m)?.[1]?.trim();

if (!token) {
  console.error("Missing THENEWSAPI_TOKEN in the environment or .env.local");
  process.exit(1);
}

const INTERESTS = [
  "general",
  "science",
  "technology",
  "business",
  "health",
  "sports",
  "entertainment",
  "politics",
  "travel",
  "food",
];

const REGIONS = ["global", "pk", "us", "gb", "in", "ca", "au"];

async function queryInterestCoverage(interest) {
  const queryCategory = interest === "technology" ? "tech" : interest;
  const url = new URL("https://api.thenewsapi.com/v1/news/all");
  url.search = new URLSearchParams({
    api_token: token,
    language: "en",
    categories: queryCategory,
    limit: "3",
  }).toString();

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) {
      return { interest, error: `HTTP ${res.status}`, httpStatus: res.status, articles: [] };
    }
    const json = await res.json();
    if (!json || !Array.isArray(json.data)) {
      return { interest, error: "invalid_response", httpStatus: res.status, articles: [] };
    }
    const rawArticles = json.data;
    return {
      interest, articles: rawArticles, httpStatus: res.status,
      quotaRemaining: res.headers.get("x-ratelimit-remaining"),
    };
  } catch (err) {
    return { interest, error: err.message, articles: [] };
  }
}

async function runDailyCoverageCheck() {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
  console.log(`[Coverage Audit] Running daily live coverage check for ${dateStr}...`);

  const interestResults = {};
  const allArticles = new Map();

  for (const interest of INTERESTS) {
    const res = await queryInterestCoverage(interest);
    const raw = res.articles;

    const evaluated = raw.map((item) => {
      const textForGeo = `${item.title} ${item.description || ""} ${item.snippet || ""}`;
      const { regions, entities } = extractEventGeography(textForGeo);
      const quality = evaluateArticleQuality(
        {
          external_id: item.uuid,
          title: item.title,
          url: item.url,
          publisher: item.source,
          published_at: item.published_at,
          description: item.description,
          snippet: item.snippet,
          raw_data: { provider: "thenewsapi", output_use: "evaluation_only" },
        },
        { now, maxAgeHours: 48, allowEvaluationOnly: true },
      );

      return {
        id: item.uuid,
        external_id: item.uuid,
        title: item.title,
        description: item.description || null,
        snippet: item.snippet || null,
        url: item.url,
        image_url: item.image_url || null,
        publisher: item.source,
        published_at: item.published_at,
        retrieved_at: now.toISOString(),
        language: item.language || "en",
        categories: item.categories || [interest],
        locale: item.locale || null,
        event_geography: regions,
        geographic_entities: entities,
        quality_eligible: quality.eligible,
        rejection_reason: quality.reason,
        raw_data: { provider: "thenewsapi", output_use: "evaluation_only" },
      };
    });

    const eligible = evaluated.filter((a) => a.quality_eligible);
    const grouped = groupSourceArticles(eligible, { allowEvaluationOnly: true });
    const distinctPublishers = new Set(eligible.map((a) => a.publisher));

    // Counts are candidates for human relevance review, not a public-use pass.
    const candidateGate = !res.error && grouped.length >= 3 && distinctPublishers.size >= 2;

    interestResults[interest] = {
      httpStatus: res.httpStatus || null,
      error: res.error || null,
      quotaRemaining: res.quotaRemaining || null,
      rawCount: raw.length,
      eligibleCount: eligible.length,
      groupedStoryCount: grouped.length,
      publisherCount: distinctPublishers.size,
      publishers: Array.from(distinctPublishers),
      candidateGate,
      verifiedGate: false,
      status: res.error ? "request_failed" : candidateGate ? "needs_review" : "shortage",
      candidateLinks: eligible.map((article) => ({
        id: article.external_id, url: article.url, publisher: article.publisher,
        publishedAt: article.published_at,
      })),
      shortageDetail: !candidateGate && !res.error
        ? `Needed >=3 grouped stories & >=2 publishers; got ${grouped.length} stories from ${distinctPublishers.size} publishers`
        : undefined,
    };

    for (const article of eligible) {
      const key = canonicalizeSourceUrl(article.url) || article.external_id;
      if (!allArticles.has(key)) allArticles.set(key, article);
    }
  }

  const uniqueArticles = [...allArticles.values()];
  const uniqueStories = groupSourceArticles(uniqueArticles, { allowEvaluationOnly: true });
  // Regional counts use unique articles and groups, not category-query repeats.
  const regionalCoverage = {};
  for (const region of REGIONS) {
    if (region === "global") {
      regionalCoverage["global"] = {
        articleCount: uniqueArticles.length,
        storyCount: uniqueStories.length,
        description: "Private evaluation candidates; relevance and public rights are unverified",
      };
    } else {
      const matchingEvents = uniqueArticles.filter((a) => a.event_geography.includes(region));
      const matchingPublishers = uniqueArticles.filter((a) => a.locale?.toLowerCase() === region);
      regionalCoverage[region] = {
        candidateArticleCount: matchingEvents.length,
        candidateStoryCount: groupSourceArticles(matchingEvents, { allowEvaluationOnly: true }).length,
        publisherLocaleCount: matchingPublishers.length,
        status: matchingEvents.length > 0 ? "needs_review" : "none_observed",
      };
    }
  }

  const report = {
    sampleDate: dateStr,
    sampledAt: now.toISOString(),
    provider: "TheNewsAPI",
    outputUse: "evaluation_only",
    status: "private_evaluation_unreviewed",
    specificationReference: "Issue #11 revision 2 / Issue #13 (R02)",
    gateRule: "Three relevant distinct Stories from two publishers per interest, after manual review and rights verification",
    interestSummary: {
      totalAdvertised: INTERESTS.length,
      candidateGateCount: Object.values(interestResults).filter((i) => i.candidateGate).length,
      verifiedGateCount: 0,
      shortageCount: Object.values(interestResults).filter((i) => i.status === "shortage").length,
      requestFailureCount: Object.values(interestResults).filter((i) => i.status === "request_failed").length,
    },
    interests: interestResults,
    regionalCoverage,
  };

  mkdirSync("tmp/daily-coverage", { recursive: true });
  const filename = `tmp/daily-coverage/${now.toISOString().replace(/[:.]/g, "-")}-${randomUUID()}.json`;
  writeFileSync(filename, JSON.stringify(report, null, 2) + "\n", { flag: "wx" });
  console.log(`[Coverage Audit] Saved daily coverage sample to ${filename}`);
  console.log(`[Coverage Audit] ${report.interestSummary.candidateGateCount}/${report.interestSummary.totalAdvertised} interests have structural candidates; public rights and relevance remain unverified.`);
  return report;
}

runDailyCoverageCheck().catch((err) => {
  console.error(err);
  process.exit(1);
});
