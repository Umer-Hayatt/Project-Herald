import type { SourceArticle } from "./types";

export interface ShowcasePartition {
  heroArticle: SourceArticle | null;
  spotlightArticle: SourceArticle | null;
  featuredArticles: SourceArticle[];
  latestArticles: SourceArticle[];
  trendingArticles: SourceArticle[];
}

const SYNTHETIC_PUBLISHER_PATTERNS = [
  /^herald verified wire$/i,
  /^fake$/i,
  /^probe$/i,
  /^test publisher$/i,
  /^synthetic$/i,
  /^mock/i,
];

const SYNTHETIC_HOST_PATTERNS = [
  /(^|\.)example\.com$/i,
  /(^|\.)example\.org$/i,
  /(^|\.)example\.net$/i,
  /(^|\.)test\.com$/i,
  /^localhost$/i,
  /^127\.0\.0\.1$/i,
];

const SYNTHETIC_TITLE_PATTERNS = [
  /trusted ingestion demonstrates/i,
  /fake test news/i,
  /synthetic fixture/i,
  /dummy headline/i,
];

/**
 * Checks whether an article is a synthetic test fixture or placeholder.
 */
export function isSyntheticFixture(article: SourceArticle): boolean {
  const publisher = (article.publisher || "").trim();
  for (const pattern of SYNTHETIC_PUBLISHER_PATTERNS) {
    if (pattern.test(publisher)) return true;
  }

  const title = (article.title || "").trim();
  for (const pattern of SYNTHETIC_TITLE_PATTERNS) {
    if (pattern.test(title)) return true;
  }

  try {
    const parsed = new URL(article.url);
    const host = parsed.hostname;
    for (const pattern of SYNTHETIC_HOST_PATTERNS) {
      if (pattern.test(host)) return true;
    }
  } catch {
    return true; // Malformed URLs are rejected
  }

  return false;
}

/**
 * Normalizes a title for loose comparison, removing punctuation,
 * extra whitespace, and case sensitivity.
 */
export function normalizeTitle(title: string): string {
  return (title || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normalizes a URL for comparison by stripping protocol, trailing slash,
 * and common analytics/tracking query parameters.
 */
export function normalizeUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    // Remove trailing slash from pathname
    let path = url.pathname.replace(/\/+$/, "");
    if (!path) path = "";
    // Only return host + path (ignore query params like utm_* and hashes)
    return `${url.hostname.toLowerCase()}${path.toLowerCase()}`;
  } catch {
    return (rawUrl || "").toLowerCase().trim();
  }
}

/**
 * Deduplicates a list of articles, keeping the earliest occurrence (typically newest)
 * and filtering out all synthetic test fixtures.
 */
export function deduplicateArticles(rawArticles: SourceArticle[]): SourceArticle[] {
  const seenTitles = new Set<string>();
  const seenUrls = new Set<string>();
  const seenIds = new Set<string>();
  const result: SourceArticle[] = [];

  for (const article of rawArticles) {
    if (!article || !article.title || !article.url) continue;

    // Filter out synthetic test fixtures
    if (isSyntheticFixture(article)) continue;

    const normTitle = normalizeTitle(article.title);
    const normUrl = normalizeUrl(article.url);

    if (article.id && seenIds.has(article.id)) continue;
    if (article.external_id && seenIds.has(article.external_id)) continue;
    if (normTitle && seenTitles.has(normTitle)) continue;
    if (normUrl && seenUrls.has(normUrl)) continue;

    if (article.id) seenIds.add(article.id);
    if (article.external_id) seenIds.add(article.external_id);
    if (normTitle) seenTitles.add(normTitle);
    if (normUrl) seenUrls.add(normUrl);

    result.push(article);
  }

  return result;
}

/**
 * Partitions distinct, deduplicated articles into strictly non-overlapping
 * showcase sections for the homepage:
 * - Hero (1)
 * - Spotlight (1)
 * - Featured Stories (up to 5)
 * - Latest News (up to 6)
 * - Wire Trending (up to 4)
 *
 * Guarantees that no article ever appears in more than one section.
 */
export function partitionShowcaseArticles(rawArticles: SourceArticle[]): ShowcasePartition {
  const distinct = deduplicateArticles(rawArticles);

  let currentIndex = 0;

  const heroArticle = distinct.length > currentIndex ? distinct[currentIndex++] : null;
  const spotlightArticle = distinct.length > currentIndex ? distinct[currentIndex++] : null;

  const featuredArticles: SourceArticle[] = [];
  const maxFeatured = 5;
  while (currentIndex < distinct.length && featuredArticles.length < maxFeatured) {
    featuredArticles.push(distinct[currentIndex++]);
  }

  const latestArticles: SourceArticle[] = [];
  const maxLatest = 6;
  while (currentIndex < distinct.length && latestArticles.length < maxLatest) {
    latestArticles.push(distinct[currentIndex++]);
  }

  const trendingArticles: SourceArticle[] = [];
  const maxTrending = 4;
  while (currentIndex < distinct.length && trendingArticles.length < maxTrending) {
    trendingArticles.push(distinct[currentIndex++]);
  }

  return {
    heroArticle,
    spotlightArticle,
    featuredArticles,
    latestArticles,
    trendingArticles,
  };
}
