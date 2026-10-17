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

function sameEventTitle(left: string, right: string): boolean {
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

/**
 * Groups only identical canonical URLs or titles with at least three shared
 * specific terms and 50% overlap. Uncertain cross-publisher matches stay apart.
 */
export function groupSourceArticles(articles: SourceArticle[]): GroupedSourceArticle[] {
  const groups: SourceArticle[][] = [];
  const ordered = articles
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
      return group.every((member) => sameEventTitle(article.title, member.title));
    });
    const matchingGroup = matchingGroups.length === 1 ? matchingGroups[0] : null;
    if (matchingGroup) matchingGroup.push(article);
    else groups.push([article]);
  }

  return groups.map((sources) => {
    const representative = [...sources].sort(representativeOrder)[0];
    const categories = [...new Set(sources.flatMap((source) =>
      (source.categories || []).map(normalizeCategory),
    ))];
    const publishedAt = sources
      .map((source) => source.published_at)
      .filter((value) => Number.isFinite(Date.parse(value)))
      .sort((a, b) => Date.parse(b) - Date.parse(a))[0] || representative.published_at;
    return {
      ...representative,
      categories,
      published_at: publishedAt,
      supportingArticles: [...sources].sort(articleOrder),
    };
  });
}
