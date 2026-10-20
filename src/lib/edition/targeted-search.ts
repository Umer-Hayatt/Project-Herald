import type { SupabaseClient } from "@supabase/supabase-js";
import type { GroupedSourceArticle, SourceArticle } from "./types";
import { filterEligibleArticles } from "./content-quality";
import { canonicalizeSourceUrl, groupSourceArticles } from "./grouping";
import { processGroupedStories } from "./story-processing";
import { executeAiEditorOrFallback, type AiEditorExecutionResult } from "./ai-editor";
import type { SelectionPreferences } from "./ranking";
import type { RecentIncludedEvent } from "./events";
import type { ReportingWriter } from "./news-supply";
import { createHash } from "node:crypto";

export interface TargetedSearchRequest {
  query: string;
  category?: string;
  language?: string;
  country?: string;
}

export interface ValidatedSearchRequest {
  sanitizedQuery: string;
  category?: string;
  language: string;
  country?: string;
}

export interface TargetedSearchExecutionResult {
  success: boolean;
  searchesExecuted: number;
  articlesFound: SourceArticle[];
  reusedFromCache: boolean;
  error?: string;
}

export interface RefinedEditionResult extends AiEditorExecutionResult {
  searchesExecuted: number;
  newStoriesDiscovered: number;
  undercoveredTopic?: string;
  refinementApplied: boolean;
}

const MAX_TARGETED_SEARCHES = 2;
const CACHE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Shared in-memory search cache to coalesce equivalent searches across readers
interface SearchCacheEntry {
  articles: SourceArticle[];
  timestamp: number;
}
const searchCache = new Map<string, SearchCacheEntry>();

export function clearSearchCacheForTesting(): void {
  searchCache.clear();
}

/**
 * Validates and sanitizes a targeted search request.
 * Strictly prevents arbitrary URL fetching, command injections, prompt instructions, and malformed queries.
 */
export function validateTargetedSearchRequest(
  request: unknown,
): { valid: true; data: ValidatedSearchRequest } | { valid: false; reason: string } {
  if (!request || typeof request !== "object") {
    return { valid: false, reason: "Search request must be an object" };
  }

  const req = request as Record<string, unknown>;
  if (typeof req.query !== "string") {
    return { valid: false, reason: "Query must be a string" };
  }

  const trimmedQuery = req.query.trim();
  if (trimmedQuery.length < 2) {
    return { valid: false, reason: "Query too short (minimum 2 characters)" };
  }
  if (trimmedQuery.length > 60) {
    return { valid: false, reason: "Query too long (maximum 60 characters)" };
  }

  const lower = trimmedQuery.toLowerCase();

  // Reject URL fetching attempts
  if (
    lower.includes("http://") ||
    lower.includes("https://") ||
    lower.includes("ftp://") ||
    lower.includes("file://") ||
    lower.startsWith("www.") ||
    lower.includes(".com/") ||
    lower.includes(".org/")
  ) {
    return { valid: false, reason: "Arbitrary URL fetching is strictly forbidden" };
  }

  // Reject command injection & dangerous script characters
  if (
    lower.includes("<script") ||
    lower.includes("curl ") ||
    lower.includes("wget ") ||
    lower.includes("bash ") ||
    lower.includes("drop table") ||
    lower.includes("delete from") ||
    lower.includes("select *") ||
    lower.includes("exec(")
  ) {
    return { valid: false, reason: "Command injection characters detected" };
  }

  // Reject prompt injection directives
  if (
    lower.includes("ignore previous") ||
    lower.includes("system prompt") ||
    lower.includes("you are now") ||
    lower.includes("bypass") ||
    lower.includes("jailbreak")
  ) {
    return { valid: false, reason: "Prompt injection directives detected in query" };
  }

  // Sanitize query to allowable text: alphanumeric, spaces, hyphens, quotes, accents
  const sanitizedQuery = trimmedQuery.replace(/[^\w\s\-"',.?!]/gi, " ").replace(/\s+/g, " ").trim();
  if (sanitizedQuery.length < 2) {
    return { valid: false, reason: "Query contained only disallowed characters" };
  }

  const language = typeof req.language === "string" && req.language.length === 2 ? req.language : "en";
  const category = typeof req.category === "string" && req.category.trim() ? req.category.trim().toLowerCase() : undefined;
  const country = typeof req.country === "string" && req.country.length === 2 ? req.country.toUpperCase() : undefined;

  return {
    valid: true,
    data: {
      sanitizedQuery,
      category,
      language,
      country,
    },
  };
}

/**
 * Normalizes query string for cache lookup to coalesce equivalent searches.
 */
function getSearchCacheKey(validated: ValidatedSearchRequest): string {
  return `${validated.sanitizedQuery.toLowerCase()}|${validated.category || ""}|${validated.language}|${validated.country || ""}`;
}

/**
 * Detects whether declared reader interests or subtopics have zero representation in candidate supply.
 */
export function detectUndercoveredInterests(
  candidates: GroupedSourceArticle[],
  preferences: SelectionPreferences,
): string | null {
  const allDeclared = [
    ...(preferences.subtopics || []),
    ...preferences.interests,
  ];

  for (const topic of allDeclared) {
    const topicLower = topic.toLowerCase();
    const hasCoverage = candidates.some((c) => {
      const inCategories = c.categories.some((cat) => cat.toLowerCase() === topicLower);
      const inTitle = c.title.toLowerCase().includes(topicLower);
      const inTopics = (c.topics || []).some((t) => t.toLowerCase() === topicLower);
      return inCategories || inTitle || inTopics;
    });

    if (!hasCoverage) {
      return topic;
    }
  }

  return null;
}

export type CustomSearchProvider = (request: ValidatedSearchRequest) => Promise<SourceArticle[]>;

/**
 * Executes a bounded search against configured providers or controlled search provider.
 * Enforces maximum 2 searches per attempt, cache reuse, content quality, and budget preservation.
 */
export async function executeBoundedTargetedSearch(
  requests: TargetedSearchRequest[],
  options?: {
    customProvider?: CustomSearchProvider;
    referenceDate?: Date;
    exhaustBudget?: boolean;
    reportingWriter?: ReportingWriter;
  },
): Promise<TargetedSearchExecutionResult> {
  if (options?.exhaustBudget) {
    return {
      success: false,
      searchesExecuted: 0,
      articlesFound: [],
      reusedFromCache: false,
      error: "Daily provider call budget exhausted",
    };
  }

  const boundedRequests = requests.slice(0, MAX_TARGETED_SEARCHES);
  let totalSearchesExecuted = 0;
  const allFoundArticles: SourceArticle[] = [];
  let anyReusedFromCache = false;
  const now = options?.referenceDate || new Date();

  for (const rawReq of boundedRequests) {
    const validation = validateTargetedSearchRequest(rawReq);
    if (!validation.valid) continue;

    const validated = validation.data;
    const cacheKey = getSearchCacheKey(validated);
    // Live results always pass the current permission gate and shared database cache.
    const cached = options?.customProvider ? searchCache.get(cacheKey) : undefined;

    // Check shared cache reuse
    if (cached && now.getTime() >= cached.timestamp && now.getTime() - cached.timestamp < CACHE_WINDOW_MS) {
      anyReusedFromCache = true;
      allFoundArticles.push(...filterEligibleArticles(cached.articles, { now, maxAgeHours: 48 }));
      continue;
    }

    try {
      let articles: SourceArticle[] = [];
      if (options?.customProvider) {
        totalSearchesExecuted++;
        articles = await options.customProvider(validated);
      } else {
        const result = await executeLiveProviderSearch(validated, now, options?.reportingWriter);
        articles = result.articles;
        totalSearchesExecuted += result.executed;
        anyReusedFromCache ||= result.reused;
      }

      // Filter through the unified content quality policy
      const eligible = filterEligibleArticles(articles, {
        now,
        maxAgeHours: 48,
        allowEvaluationOnly: false,
      });

      // Save to shared cache for coalescing
      if (options?.customProvider && eligible.length > 0) searchCache.set(cacheKey, {
        articles: eligible,
        timestamp: now.getTime(),
      });

      allFoundArticles.push(...eligible);
    } catch (err) {
      // Retain failed search record without throwing; continues gracefully
      console.warn(`[Herald] Targeted search failed for query "${validated.sanitizedQuery}":`, err);
    }
  }

  // Deduplicate articles found by canonical URL
  const dedupedMap = new Map<string, SourceArticle>();
  for (const art of allFoundArticles) {
    const canonical = canonicalizeSourceUrl(art.url) || art.url;
    if (!dedupedMap.has(canonical)) {
      dedupedMap.set(canonical, art);
    }
  }

  const finalArticles = Array.from(dedupedMap.values());

  return {
    success: finalArticles.length > 0,
    searchesExecuted: totalSearchesExecuted,
    articlesFound: finalArticles,
    reusedFromCache: anyReusedFromCache,
  };
}

/**
 * Calls live providers (GNews or TheNewsAPI) with strict timeout and parameter validation.
 */
async function executeLiveProviderSearch(
  validated: ValidatedSearchRequest,
  now: Date,
  writer?: ReportingWriter,
): Promise<{ articles: SourceArticle[]; executed: number; reused: boolean }> {
  const unavailable = { articles: [], executed: 0, reused: false };
  const gnewsKey = process.env.GNEWS_API_KEY;
  if (gnewsKey && process.env.GNEWS_COMMERCIAL_APPROVED === "true" && writer) {
    const key = createHash("sha256").update(`gnews-commercial-v1|${getSearchCacheKey(validated)}`).digest("hex");
    const { data: cached, error: cacheError } = await writer.rpc("read_reporting_search", { p_key: key });
    if (cacheError) return unavailable;
    if (Array.isArray(cached)) {
      return { articles: filterEligibleArticles(cached as SourceArticle[], { now, maxAgeHours: 48 }), executed: 0, reused: true };
    }
    const { data: token, error } = await writer.rpc("claim_reporting_refresh", {
      p_force_refresh: true, p_provider_calls: 1,
    });
    if (error) return unavailable;
    if (!token) {
      // Another instance may be filling this query. Wait only within the provider's
      // timeout window; never reserve again or issue an unbudgeted fallback call.
      for (let attempt = 0; attempt < 8; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (process.env.GNEWS_COMMERCIAL_APPROVED !== "true") return unavailable;
        const { data: pending, error: pendingError } = await writer.rpc("read_reporting_search", { p_key: key });
        if (pendingError) return unavailable;
        if (Array.isArray(pending)) {
          return { articles: filterEligibleArticles(pending as SourceArticle[], { now, maxAgeHours: 48 }), executed: 0, reused: true };
        }
      }
      return unavailable;
    }
    try {
      // A previous worker may finish between our initial cache miss and claim.
      const { data: completed, error: completedError } = await writer.rpc("read_reporting_search", { p_key: key });
      if (completedError || process.env.GNEWS_COMMERCIAL_APPROVED !== "true") return unavailable;
      if (Array.isArray(completed)) {
        return { articles: filterEligibleArticles(completed as SourceArticle[], { now, maxAgeHours: 48 }), executed: 0, reused: true };
      }
      const url = new URL("https://gnews.io/api/v4/search");
      url.search = new URLSearchParams({
        q: validated.sanitizedQuery,
        apikey: gnewsKey,
        lang: validated.language,
        max: "5",
      }).toString();
      if (validated.country) url.searchParams.set("country", validated.country.toLowerCase());

      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const body = (await res.json()) as { articles?: Array<Record<string, unknown>> };
        if (Array.isArray(body.articles)) {
          const articles = body.articles.map((item) => ({
            id: `gnews-search-${createHash("sha256").update(String(item.url || "")).digest("hex")}`,
            external_id: `gnews-${createHash("sha256").update(String(item.url || "")).digest("hex")}`,
            title: String(item.title || ""),
            description: typeof item.description === "string" ? item.description : null,
            snippet: typeof item.content === "string" ? item.content.slice(0, 300) : null,
            url: String(item.url || ""),
            image_url: typeof item.image === "string" ? item.image : null,
            publisher: typeof (item.source as Record<string, unknown>)?.name === "string"
              ? (item.source as Record<string, unknown>).name as string
              : "",
            published_at: typeof item.publishedAt === "string" ? item.publishedAt : "",
            retrieved_at: now.toISOString(),
            language: validated.language,
            categories: ["general"],
            locale: null,
            raw_data: { provider: "gnews", output_use: "commercial", retrieved_at: now.toISOString(), canonical_url: canonicalizeSourceUrl(String(item.url || "")) },
          }));
          const eligible = filterEligibleArticles(articles, { now, maxAgeHours: 48 });
          await writer.rpc("save_reporting_search", { p_key: key, p_lock_token: token, p_articles: eligible });
          return { articles: eligible, executed: 1, reused: false };
        }
      }
      return { articles: [], executed: 1, reused: false };
    } catch {
      // The reservation counts the attempted provider call even on network/JSON failure.
      return { articles: [], executed: 1, reused: false };
    } finally {
      // Search must not mark the broad reporting cache as refreshed.
      await writer.rpc("finish_reporting_refresh", { p_lock_token: token, p_succeeded: false });
    }
  }

  return unavailable;
}

/**
 * Orchestrates undercovered interest discovery and one refinement round for an Edition.
 */
export async function refineEditionWithTargetedSearch(
  supabase: SupabaseClient,
  initialCandidates: GroupedSourceArticle[],
  preferences: SelectionPreferences,
  referenceDate: Date = new Date(),
  positivelyLearnedTopics: string[] = [],
  topicFeedback: Record<string, number> = {},
  recentInclusions: RecentIncludedEvent[] = [],
  options?: {
    customSearchProvider?: CustomSearchProvider;
    exhaustBudget?: boolean;
    controlledAiResponse?: unknown;
    explicitSearchRequests?: TargetedSearchRequest[];
    reportingWriter?: ReportingWriter;
  },
): Promise<RefinedEditionResult> {
  // 1. Initial selection attempt
  const initialSelection = await executeAiEditorOrFallback(
    initialCandidates,
    preferences,
    referenceDate,
    positivelyLearnedTopics,
    topicFeedback,
    recentInclusions,
    options?.controlledAiResponse,
  );

  // 2. Identify undercovered topic
  const undercoveredTopic = detectUndercoveredInterests(initialCandidates, preferences);
  let searchRequests: TargetedSearchRequest[] = options?.explicitSearchRequests || [];

  if (searchRequests.length === 0 && undercoveredTopic) {
    searchRequests = [{ query: undercoveredTopic, category: undercoveredTopic.toLowerCase() }];
  }

  // If no undercovered topic and no search requested, return initial selection immediately
  if (searchRequests.length === 0) {
    return {
      ...initialSelection,
      searchesExecuted: 0,
      newStoriesDiscovered: 0,
      refinementApplied: false,
    };
  }

  // 3. Execute bounded search (enforcing max 2 searches, budget, and validation)
  const searchResult = await executeBoundedTargetedSearch(searchRequests, {
    customProvider: options?.customSearchProvider,
    referenceDate,
    exhaustBudget: options?.exhaustBudget,
    reportingWriter: options?.reportingWriter,
  });

  if (!searchResult.success || searchResult.articlesFound.length === 0) {
    // Honest shortage explanation when search yielded no eligible results or budget was exhausted
    const shortageNote = options?.exhaustBudget
      ? "Daily provider search quota was reached; showing available reporting without refinement."
      : undercoveredTopic
        ? `No eligible fresh reporting was found for declared interest "${undercoveredTopic}".`
        : "Additional targeted searches yielded no eligible source-grounded reporting.";

    return {
      ...initialSelection,
      searchesExecuted: searchResult.searchesExecuted,
      newStoriesDiscovered: 0,
      undercoveredTopic: undercoveredTopic || undefined,
      refinementApplied: false,
      discoveryShortage: "no_eligible_story",
      editorialReasoning: initialSelection.editorialReasoning
        ? `${initialSelection.editorialReasoning}; ${shortageNote}`
        : shortageNote,
    };
  }

  // Group the combined reporting, since search IDs differ from persisted source IDs.
  const combinedGroups = groupSourceArticles([
    ...initialCandidates.flatMap((candidate) => candidate.supportingArticles.length ? candidate.supportingArticles : [candidate]),
    ...searchResult.articlesFound,
  ]);
  const processedNew = await processGroupedStories(supabase, combinedGroups, options?.reportingWriter);
  const enrichedCandidates: GroupedSourceArticle[] = combinedGroups.map((g) => {
    const processed = processedNew.get(g.id || g.external_id);
    return {
      ...g,
      briefing: processed?.briefing,
      whyItMatters: processed?.whyItMatters || null,
      topics: processed?.topics || [],
      briefingSource: processed?.source || "publisher_excerpt",
      categories: processed?.topics.length ? processed.topics : g.categories,
    };
  });

  // 5. Select refined edition
  const refinedSelection = await executeAiEditorOrFallback(
    enrichedCandidates,
    preferences,
    referenceDate,
    positivelyLearnedTopics,
    topicFeedback,
    recentInclusions,
    // Note: controlledAiResponse is not passed to refinement so refinement uses grounded selection over enriched pool
  );

  return {
    ...refinedSelection,
    searchesExecuted: searchResult.searchesExecuted,
    newStoriesDiscovered: Math.max(0, combinedGroups.length - initialCandidates.length),
    undercoveredTopic: undercoveredTopic || undefined,
    refinementApplied: true,
  };
}
