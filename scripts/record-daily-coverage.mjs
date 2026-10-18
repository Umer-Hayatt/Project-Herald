import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { evaluateArticleQuality } from "../src/lib/edition/content-quality.ts";
import { extractEventGeography } from "../src/lib/edition/geography.ts";
import { groupSourceArticles } from "../src/lib/edition/grouping.ts";

const env = readFileSync(".env.local", "utf8");
const token = env.match(/THENEWSAPI_TOKEN=(.+)/)?.[1]?.trim();

if (!token) {
  console.error("Missing THENEWSAPI_TOKEN in .env.local");
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
    limit: "5",
  }).toString();

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) {
      return { interest, error: `HTTP ${res.status}`, articles: [] };
    }
    const json = await res.json();
    const rawArticles = Array.isArray(json.data) ? json.data : [];
    return { interest, articles: rawArticles };
  } catch (err) {
    return { interest, error: err.message, articles: [] };
  }
}

async function runDailyCoverageCheck() {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
  console.log(`[Coverage Audit] Running daily live coverage check for ${dateStr}...`);

  const interestResults = {};
  const allArticles = [];

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
        },
        { now, maxAgeHours: 48 },
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
      };
    });

    const eligible = evaluated.filter((a) => a.quality_eligible);
    const grouped = groupSourceArticles(eligible);
    const distinctPublishers = new Set(eligible.map((a) => a.publisher));

    // Spec Gate: at least 3 eligible distinct relevant Stories from at least 2 publishers
    const passesGate = grouped.length >= 3 && distinctPublishers.size >= 2;

    interestResults[interest] = {
      rawCount: raw.length,
      eligibleCount: eligible.length,
      groupedStoryCount: grouped.length,
      publisherCount: distinctPublishers.size,
      publishers: Array.from(distinctPublishers),
      passesGate,
      status: passesGate ? "sufficient" : "shortage",
      shortageDetail: !passesGate
        ? `Needed >=3 grouped stories & >=2 publishers; got ${grouped.length} stories from ${distinctPublishers.size} publishers`
        : undefined,
    };

    allArticles.push(...eligible);
  }

  // Regional breakdown across all eligible articles
  const regionalCoverage = {};
  for (const region of REGIONS) {
    if (region === "global") {
      regionalCoverage["global"] = {
        count: allArticles.length,
        description: "All eligible stories remain eligible for global baseline reading",
      };
    } else {
      const matchingEvents = allArticles.filter((a) => a.event_geography.includes(region));
      const matchingPublishers = allArticles.filter((a) => a.locale?.toLowerCase() === region);
      regionalCoverage[region] = {
        eventConfirmedCount: matchingEvents.length,
        publisherLocaleCount: matchingPublishers.length,
        status: matchingEvents.length > 0 ? "available" : "global_fallback_only",
      };
    }
  }

  const report = {
    sampleDate: dateStr,
    sampledAt: now.toISOString(),
    provider: "TheNewsAPI",
    specificationReference: "Issue #11 revision 2 / Issue #13 (R02)",
    gateRule: "At least 3 eligible distinct relevant Stories from at least 2 publishers per advertised interest",
    interestSummary: {
      totalAdvertised: INTERESTS.length,
      meetingGate: Object.values(interestResults).filter((i) => i.passesGate).length,
      shortageCount: Object.values(interestResults).filter((i) => !i.passesGate).length,
    },
    interests: interestResults,
    regionalCoverage,
  };

  mkdirSync("docs/evidence/daily-coverage", { recursive: true });
  const filename = `docs/evidence/daily-coverage/${dateStr}.json`;
  writeFileSync(filename, JSON.stringify(report, null, 2) + "\n");
  console.log(`[Coverage Audit] Saved daily coverage sample to ${filename}`);
  console.log(`[Coverage Audit] Summary: ${report.interestSummary.meetingGate}/${report.interestSummary.totalAdvertised} interests meet gate.`);
  return report;
}

runDailyCoverageCheck().catch((err) => {
  console.error(err);
  process.exit(1);
});
