export type ArticleRejectionReason =
  | "missing_provenance"
  | "feed_or_index_url"
  | "generic_title"
  | "malformed_date"
  | "future_date"
  | "stale_date"
  | "insufficient_text";

export interface ArticleQualityEvaluation {
  eligible: boolean;
  reason?: ArticleRejectionReason;
  detail?: string;
}

const GENERIC_TITLES = new Set([
  "home",
  "index",
  "top stories",
  "latest news",
  "breaking news",
  "front page",
  "news",
  "untitled",
  "daily briefing",
  "daily update",
  "morning edition",
  "subscribe",
  "log in",
  "sign in",
  "all news",
  "world news",
  "headlines",
  "read more",
  "editorial",
  "opinion",
  "article",
  "update",
]);

const FEED_OR_INDEX_PATH_REGEX =
  /^(\/|\/index\.(html?|php|asp)|\/news\/?|\/top-stories\/?|\/front-page\/?|\/feed\/?|\/rss(\.xml)?|\/atom\.xml|\/(feeds|rss|tags?|categories?|topics?|search|archive)\/?[^\/]*)$/i;

const COMMENT_URL_REGEX = /\/(comments?|discussions?)\b/i;

const BOILERPLATE_PATTERNS = [
  /click here to read/i,
  /subscribe to (read|continue)/i,
  /read the full (story|article)/i,
  /javascript is (required|disabled)/i,
  /access denied/i,
  /page not found|404 not found/i,
  /please enable cookies/i,
  /sign in to continue/i,
];

function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Common content-quality eligibility policy applied to reporting ingestion,
 * preview curation, and newly generated Editions.
 */
export function evaluateArticleQuality(
  article: {
    external_id?: string;
    title?: string;
    url?: string;
    publisher?: string;
    published_at?: string;
    description?: string | null;
    snippet?: string | null;
  },
  options?: {
    now?: Date;
    maxAgeHours?: number;
  },
): ArticleQualityEvaluation {
  // 1. Provenance checks
  if (
    !article ||
    typeof article !== "object" ||
    !article.external_id ||
    typeof article.external_id !== "string" ||
    article.external_id.trim().length === 0 ||
    !article.publisher ||
    typeof article.publisher !== "string" ||
    article.publisher.trim().length < 2 ||
    !article.url ||
    typeof article.url !== "string" ||
    !/^https?:\/\//i.test(article.url)
  ) {
    return {
      eligible: false,
      reason: "missing_provenance",
      detail: "Missing valid external_id, publisher, or http(s) URL",
    };
  }

  // 2. Date checks
  if (!article.published_at || typeof article.published_at !== "string") {
    return {
      eligible: false,
      reason: "malformed_date",
      detail: "Published date is missing or not a string",
    };
  }

  const publishedMs = Date.parse(article.published_at);
  if (!Number.isFinite(publishedMs)) {
    return {
      eligible: false,
      reason: "malformed_date",
      detail: `Date could not be parsed: ${article.published_at}`,
    };
  }

  const now = options?.now || new Date();
  const nowMs = now.getTime();
  // Allow 15 minutes of clock skew into the future
  if (publishedMs > nowMs + 15 * 60 * 1000) {
    return {
      eligible: false,
      reason: "future_date",
      detail: `Article date is in the future: ${article.published_at}`,
    };
  }

  const maxAgeHours = options?.maxAgeHours ?? 48;
  const freshestAllowedMs = nowMs - maxAgeHours * 60 * 60 * 1000;
  if (publishedMs < freshestAllowedMs) {
    return {
      eligible: false,
      reason: "stale_date",
      detail: `Article is older than ${maxAgeHours} hours`,
    };
  }

  // 3. Feed, comment, or index page URL
  try {
    const parsedUrl = new URL(article.url);
    const path = parsedUrl.pathname;
    if (FEED_OR_INDEX_PATH_REGEX.test(path) || COMMENT_URL_REGEX.test(path)) {
      return {
        eligible: false,
        reason: "feed_or_index_url",
        detail: `URL path indicates an index, feed, tag, or comment stream: ${path}`,
      };
    }
  } catch {
    return {
      eligible: false,
      reason: "missing_provenance",
      detail: "Invalid URL structure",
    };
  }

  // 4. Generic titles
  const cleanTitle = stripHtml(article.title || "");
  const titleWords = cleanTitle.split(/\s+/).filter(Boolean);
  if (
    cleanTitle.length < 15 ||
    titleWords.length < 4 ||
    GENERIC_TITLES.has(cleanTitle.toLowerCase())
  ) {
    return {
      eligible: false,
      reason: "generic_title",
      detail: `Title is too short or generic: "${cleanTitle}"`,
    };
  }

  // 5. Insufficient text / empty wrappers / paywall boilerplate
  const cleanDesc = stripHtml(article.description || "");
  const cleanSnippet = stripHtml(article.snippet || "");

  const combinedBody = `${cleanDesc} ${cleanSnippet}`.trim();
  for (const pattern of BOILERPLATE_PATTERNS) {
    if (pattern.test(combinedBody) && combinedBody.length < 120) {
      return {
        eligible: false,
        reason: "insufficient_text",
        detail: "Body contains generic boilerplate wrapper",
      };
    }
  }

  const fullText = `${cleanTitle} ${combinedBody}`.trim();
  const fullWords = fullText.split(/\s+/).filter(Boolean);
  if (fullWords.length < 15 || fullText.length < 60) {
    return {
      eligible: false,
      reason: "insufficient_text",
      detail: `Insufficient substantive text (${fullWords.length} words, ${fullText.length} chars)`,
    };
  }

  return { eligible: true };
}

/**
 * Filter an array of candidate articles against the eligibility policy.
 */
export function filterEligibleArticles<T extends {
  external_id?: string;
  title?: string;
  url?: string;
  publisher?: string;
  published_at?: string;
  description?: string | null;
  snippet?: string | null;
}>(
  articles: T[],
  options?: {
    now?: Date;
    maxAgeHours?: number;
    onRejected?: (article: T, evalResult: ArticleQualityEvaluation) => void;
  },
): T[] {
  return articles.filter((article) => {
    const evaluation = evaluateArticleQuality(article, options);
    if (!evaluation.eligible && options?.onRejected) {
      options.onRejected(article, evaluation);
    }
    return evaluation.eligible;
  });
}
