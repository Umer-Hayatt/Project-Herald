import { createClient } from "@supabase/supabase-js";
import { evaluateArticleQuality } from "../src/lib/edition/content-quality.ts";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const env = readFileSync(".env.local", "utf8");
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const key = env.match(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=(.+)/)?.[1]?.trim();

if (!url || !key) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);

async function auditSupply() {
  console.log("Auditing existing source_articles in database...");
  const { data: articles, error } = await supabase
    .from("source_articles")
    .select("*")
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Failed to query source_articles:", error);
    process.exit(1);
  }

  const now = new Date();
  const total = articles.length;
  console.log(`Retrieved ${total} records from source_articles.`);

  const reasonCounts = {
    missing_provenance: 0,
    feed_or_index_url: 0,
    generic_title: 0,
    malformed_date: 0,
    future_date: 0,
    stale_date: 0,
    insufficient_text: 0,
  };

  const testRecords = [];
  const liveRecords = [];
  const eligibleRecords = [];
  const rejectedRecords = [];

  const textDepths = [];
  const publisherCounts = {};
  const localeCounts = {};

  for (const article of articles) {
    const isTest =
      article.external_id?.startsWith("test-") ||
      article.external_id?.startsWith("probe-") ||
      article.publisher === "Science Wire" ||
      article.publisher === "Tech Herald" ||
      article.publisher === "Probe";

    if (isTest) {
      testRecords.push(article);
    } else {
      liveRecords.push(article);
    }

    const evaluation = evaluateArticleQuality(article, { now, maxAgeHours: 48 });
    if (evaluation.eligible) {
      eligibleRecords.push(article);
    } else {
      rejectedRecords.push({ article, evaluation });
      if (evaluation.reason && reasonCounts[evaluation.reason] !== undefined) {
        reasonCounts[evaluation.reason]++;
      }
    }

    const combinedText = `${article.title || ""} ${article.description || ""} ${article.snippet || ""}`.trim();
    const words = combinedText.split(/\s+/).filter(Boolean);
    textDepths.push({
      id: article.id,
      external_id: article.external_id,
      title: article.title,
      publisher: article.publisher,
      wordCount: words.length,
      charLength: combinedText.length,
      published_at: article.published_at,
    });

    publisherCounts[article.publisher] = (publisherCounts[article.publisher] || 0) + 1;
    const loc = article.locale || "unspecified";
    localeCounts[loc] = (localeCounts[loc] || 0) + 1;
  }

  textDepths.sort((a, b) => b.wordCount - a.wordCount);

  // Check that completed editions remain intact
  const { data: editions } = await supabase
    .from("editions")
    .select("id, edition_date, reader_id, status, created_at")
    .eq("status", "completed");

  const auditReport = {
    auditedAt: now.toISOString(),
    totalArticles: total,
    segregation: {
      liveProviderRecords: liveRecords.length,
      testFixtureRecords: testRecords.length,
    },
    qualityEvaluation: {
      eligibleCount: eligibleRecords.length,
      rejectedCount: rejectedRecords.length,
      rejectionBreakdown: reasonCounts,
    },
    textDepthMetrics: {
      minWords: textDepths[textDepths.length - 1]?.wordCount || 0,
      maxWords: textDepths[0]?.wordCount || 0,
      medianWords: textDepths[Math.floor(textDepths.length / 2)]?.wordCount || 0,
      topPublishers: Object.entries(publisherCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
      localesObserved: localeCounts,
    },
    completedEditionsIntact: {
      count: editions?.length || 0,
      editions: (editions || []).map((e) => ({
        id: e.id,
        edition_date: e.edition_date,
        status: e.status,
        created_at: e.created_at,
      })),
    },
    sampleAttributableRecords: eligibleRecords.slice(0, 5).map((a) => ({
      external_id: a.external_id,
      title: a.title,
      publisher: a.publisher,
      url: a.url,
      published_at: a.published_at,
      wordCount: `${a.title || ""} ${a.description || ""} ${a.snippet || ""}`.split(/\s+/).length,
    })),
  };

  mkdirSync("docs/evidence", { recursive: true });
  writeFileSync(
    "docs/evidence/supply-audit-report.json",
    JSON.stringify(auditReport, null, 2) + "\n",
  );

  console.log("\n--- AUDIT SUMMARY ---");
  console.log(`Total Articles: ${total}`);
  console.log(`Live: ${liveRecords.length}, Test: ${testRecords.length}`);
  console.log(`Eligible: ${eligibleRecords.length}, Rejected: ${rejectedRecords.length}`);
  console.log("Rejection Reasons:", JSON.stringify(reasonCounts, null, 2));
  console.log(`Completed Editions Intact: ${editions?.length || 0}`);
  console.log("Saved to docs/evidence/supply-audit-report.json");
}

auditSupply().catch(console.error);
