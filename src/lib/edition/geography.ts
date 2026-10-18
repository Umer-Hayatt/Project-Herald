export interface ArticleGeographyResolution {
  publisherCountry: string | null;
  eventGeography: string[];
  isEventCountryConfirmed: boolean;
  detectedEntities: string[];
}

interface RegionDefinition {
  code: string;
  name: string;
  patterns: RegExp[];
}

const REGION_DEFINITIONS: RegionDefinition[] = [
  {
    code: "pk",
    name: "Pakistan",
    patterns: [
      /\b(pakistan|pakistani|islamabad|karachi|lahore|rawalpindi|peshawar|quetta|faisalabad|multan|balochistan|punjab|kpk|sindh)\b/i,
    ],
  },
  {
    code: "us",
    name: "United States",
    patterns: [
      /\b(united\s+states|u\.s\.a?|america|american|washington|new\s+york|california|texas|florida|pentagon|white\s+house|capitol\s+hill|congress|senate|biden|trump|silicon\s+valley)\b/i,
    ],
  },
  {
    code: "gb",
    name: "United Kingdom",
    patterns: [
      /\b(united\s+kingdom|u\.k\.|britain|british|england|scotland|wales|london|westminster|downing\s+street|parliament|starmer|sunak)\b/i,
    ],
  },
  {
    code: "in",
    name: "India",
    patterns: [
      /\b(india|indian|new\s+delhi|delhi|mumbai|bengaluru|bangalore|hyderabad|kolkata|chennai|modi|bharat)\b/i,
    ],
  },
  {
    code: "ca",
    name: "Canada",
    patterns: [
      /\b(canada|canadian|ottawa|toronto|ontario|vancouver|montreal|quebec|trudeau)\b/i,
    ],
  },
  {
    code: "au",
    name: "Australia",
    patterns: [
      /\b(australia|australian|sydney|melbourne|canberra|brisbane|albanese)\b/i,
    ],
  },
];

/**
 * Extracts event geography and named geographic entities from article content.
 * Never conflates publisher registration country with the reported event geography.
 */
export function extractEventGeography(text: string): {
  regions: string[];
  entities: string[];
} {
  if (!text || text.trim().length === 0) {
    return { regions: [], entities: [] };
  }

  const normalized = text.toLowerCase();
  const matchedRegions = new Set<string>();
  const detectedEntities: string[] = [];

  for (const region of REGION_DEFINITIONS) {
    for (const pattern of region.patterns) {
      const match = normalized.match(pattern);
      if (match) {
        matchedRegions.add(region.code);
        detectedEntities.push(match[0]);
      }
    }
  }

  return {
    regions: Array.from(matchedRegions),
    entities: Array.from(new Set(detectedEntities)),
  };
}

/**
 * Resolves both publisher country provenance and reported event geography.
 */
export function resolveArticleGeography(article: {
  title?: string;
  description?: string | null;
  snippet?: string | null;
  locale?: string | null;
  raw_data?: Record<string, unknown> | null;
}): ArticleGeographyResolution {
  const content = [article.title, article.description, article.snippet]
    .filter(Boolean)
    .join(" ");

  const { regions, entities } = extractEventGeography(content);

  // Normalize publisher locale (from provider metadata or raw_data)
  const publisherCountry =
    (article.locale?.trim().toLowerCase() ||
      (article.raw_data?.publisher_locale as string | undefined)?.toLowerCase() ||
      null);

  // An event country is confirmed only if text specifically mentions that region
  const isEventCountryConfirmed =
    Boolean(publisherCountry && regions.includes(publisherCountry));

  return {
    publisherCountry,
    eventGeography: regions,
    isEventCountryConfirmed,
    detectedEntities: entities,
  };
}
