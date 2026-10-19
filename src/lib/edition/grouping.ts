import type { GroupedSourceArticle, SourceArticle } from "./types";

const TITLE_STOP_WORDS = new Set([
  "a", "an", "and", "as", "at", "after", "amid", "are", "around", "by",
  "for", "from", "in", "into", "is", "its", "new", "of", "on", "or", "over",
  "says", "the", "to", "with", "report", "reports", "news", "update", "updates",
  "announces", "announced", "launches", "launched",
]);

const TRACKING_PARAMETERS = new Set([
  "fbclid", "gclid", "mc_cid", "mc_eid", "ref", "source", "campaign",
]);
const EVENT_EVIDENCE_STOP_WORDS = new Set([
  ...TITLE_STOP_WORDS,
  "official", "officials", "government", "announced", "announcement", "plan",
  "policy", "climate", "development", "developments", "according", "statement",
  "statements", "today", "yesterday", "newspaper", "publisher",
]);
const EVENT_WINDOW_MS = 36 * 60 * 60 * 1000;

export function canonicalizeSourceUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    url.hash = "";
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    for (const key of [...url.searchParams.keys()]) {
      const lowerKey = key.toLowerCase();
      if (lowerKey.startsWith("utm_") || TRACKING_PARAMETERS.has(lowerKey)) {
        url.searchParams.delete(key);
      }
    }
    url.searchParams.sort();
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function titleTokens(title: string): Set<string> {
  const normalized = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}]+/gu, " ");
  return new Set(
    normalized
      .split(/\s+/)
      .filter((word) => word.length > 1 && !TITLE_STOP_WORDS.has(word)),
  );
}

export function sameEventTitle(left: string, right: string): boolean {
  const leftTokens = titleTokens(left);
  const rightTokens = titleTokens(right);
  if (!leftTokens.size || !rightTokens.size) return false;

  const shared = [...leftTokens].filter((token) => rightTokens.has(token));
  // Require several specific terms and a strong overlap. A shared topic word
  // such as "election" or "technology" is never enough to merge two reports.
  if (shared.length < 3) return false;
  const unionSize = new Set([...leftTokens, ...rightTokens]).size;
  return shared.length / unionSize >= 0.5;
}

function articleEvidenceTokens(article: SourceArticle): Set<string> {
  return new Set(
    [...titleTokens([article.description, article.snippet].filter(Boolean).join(" "))]
      .filter((token) => !EVENT_EVIDENCE_STOP_WORDS.has(token)),
  );
}

export function namedEntityTokens(article: SourceArticle): Set<string> {
  const content = [article.title, article.description, article.snippet]
    .filter(Boolean)
    .join(" ");
  return new Set(
    content.match(/\b[A-Z][\p{Ll}]{2,}\b/gu)
      ?.map((entity) => entity.toLowerCase())
      .filter((entity) => !EVENT_EVIDENCE_STOP_WORDS.has(entity)) || [],
  );
}

export function hasSharedEventEvidence(left: SourceArticle, right: SourceArticle): boolean {
  const leftEntities = namedEntityTokens(left);
  const rightEntities = namedEntityTokens(right);
  if ([...leftEntities].some((entity) => rightEntities.has(entity))) return true;

  const leftEvidence = articleEvidenceTokens(left);
  const rightEvidence = articleEvidenceTokens(right);
  const sharedEvidence = [...leftEvidence].filter((token) => rightEvidence.has(token));
  return sharedEvidence.length >= 2;
}

function sameEvent(left: SourceArticle, right: SourceArticle): boolean {
  const leftPublishedAt = Date.parse(left.published_at);
  const rightPublishedAt = Date.parse(right.published_at);
  if (!Number.isFinite(leftPublishedAt) || !Number.isFinite(rightPublishedAt)) return false;
  if (Math.abs(leftPublishedAt - rightPublishedAt) > EVENT_WINDOW_MS) return false;
  return sameEventTitle(left.title, right.title) && hasSharedEventEvidence(left, right);
}

function articleOrder(left: SourceArticle, right: SourceArticle): number {
  const publishedDiff = Date.parse(right.published_at) - Date.parse(left.published_at);
  if (Number.isFinite(publishedDiff) && publishedDiff !== 0) return publishedDiff;
  return left.external_id.localeCompare(right.external_id);
}

function representativeOrder(left: SourceArticle, right: SourceArticle): number {
  const textLength = (right.snippet || right.description || "").length -
    (left.snippet || left.description || "").length;
  return textLength || articleOrder(left, right);
}

function normalizeCategory(category: string): string {
  const normalized = category.trim().toLowerCase();
  return normalized === "tech" ? "technology" : normalized;
}

function isEvaluationOnly(article: SourceArticle): boolean {
  return (
    (article as { output_use?: string }).output_use === "evaluation_only" ||
    (article.raw_data as { output_use?: string } | undefined)?.output_use === "evaluation_only"
  );
}

function providerAwareRepresentativeOrder(left: SourceArticle, right: SourceArticle): number {
  // Commercial material always takes precedence over evaluation-only for representation
  const leftEval = isEvaluationOnly(left);
  const rightEval = isEvaluationOnly(right);
  if (leftEval !== rightEval) {
    return leftEval ? 1 : -1;
  }
  return representativeOrder(left, right);
}

/**
 * Groups identical canonical URLs or reports within 36 hours whose headlines
 * overlap strongly and share named-entity or body-text evidence. Uncertain
 * cross-publisher matches stay apart.
 * Segregates evaluation-only material from production groups and supporting sources.
 */
export function groupSourceArticles(
  articles: SourceArticle[],
  options?: { allowEvaluationOnly?: boolean },
): GroupedSourceArticle[] {
  const allowEvaluationOnly = options?.allowEvaluationOnly ?? false;

  // Filter out evaluation-only material upfront if not explicitly allowed
  const eligibleArticles = allowEvaluationOnly
    ? articles
    : articles.filter((article) => !isEvaluationOnly(article));

  const groups: SourceArticle[][] = [];
  const ordered = eligibleArticles
    .filter((article) => canonicalizeSourceUrl(article.url) !== null)
    .map((article) => ({ ...article, url: canonicalizeSourceUrl(article.url)! }))
    .sort((a, b) => {
      const urlDiff = (canonicalizeSourceUrl(a.url) || a.url).localeCompare(
        canonicalizeSourceUrl(b.url) || b.url,
      );
      return urlDiff || articleOrder(a, b);
    });

  for (const article of ordered) {
    const canonicalUrl = canonicalizeSourceUrl(article.url);
    const matchingGroups = groups.filter((group) => {
      if (canonicalUrl && group.some((member) => canonicalizeSourceUrl(member.url) === canonicalUrl)) {
        return true;
      }
      return group.every((member) => sameEvent(article, member));
    });
    const matchingGroup = matchingGroups.length === 1 ? matchingGroups[0] : null;
    if (matchingGroup) matchingGroup.push(article);
    else groups.push([article]);
  }

  return groups.map((sources) => {
    // Sort sources to find best representative
    const sortedSources = [...sources].sort(providerAwareRepresentativeOrder);
    const representative = sortedSources[0];

    // Filter supporting articles to ensure evaluation-only never enters production groups
    const supporting = (
      allowEvaluationOnly
        ? sortedSources
        : sortedSources.filter((s) => !isEvaluationOnly(s))
    ).sort(articleOrder);

    const categories = [...new Set(supporting.flatMap((source) =>
      (source.categories || []).map(normalizeCategory),
    ))];
    const publishedAt = supporting
      .map((source) => source.published_at)
      .filter((value) => Number.isFinite(Date.parse(value)))
      .sort((a, b) => Date.parse(b) - Date.parse(a))[0] || representative.published_at;
    const imageUrl = representative.image_url ||
      supporting.find((source) => Boolean(source.image_url))?.image_url || null;

    return {
      ...representative,
      image_url: imageUrl,
      categories: categories.length ? categories : representative.categories,
      published_at: publishedAt,
      supportingArticles: supporting,
    };
  });
}

