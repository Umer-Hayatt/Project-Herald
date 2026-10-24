import type { EditionStory, SourceAttribution } from "./types";

export const CC_BY_3_LICENSE_URL = "https://creativecommons.org/licenses/by/3.0/";
export const NASA_EARTH_POLICY_URL = "https://science.nasa.gov/earth/faq/";

export function isNasaEarthArticleUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "science.nasa.gov" && !url.port && !url.username && !url.password && !url.search && !url.hash &&
      /^\/earth\/earth-observatory\/[a-z0-9-]+\/$/.test(url.pathname) && !/\/(?:topics|subscribe|feeds|explorer|image-of-the-day)\/$/.test(url.pathname);
  } catch { return false; }
}

export function isGlobalVoicesArticleUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "globalvoices.org" && !url.port &&
      !url.username && !url.password && !url.search && !url.hash && /^\/\d{4}\/\d{2}\/\d{2}\/[^/]+\/?$/.test(url.pathname);
  } catch { return false; }
}

/** Keep only explicit, complete credits; never infer a licence from a publisher name. */
export function parseSourceAttribution(value: unknown): SourceAttribution | undefined {
  if (!value || typeof value !== "object") return undefined;
  const data = value as Record<string, unknown>;
  const permitted = (data.license === "CC BY 3.0" && data.license_url === CC_BY_3_LICENSE_URL) ||
    (data.license === "NASA Earth reuse policy" && data.license_url === NASA_EARTH_POLICY_URL);
  if (!permitted ||
    !Array.isArray(data.authors) || data.authors.length < 1 || data.authors.length > 8 ||
    !data.authors.every(author => typeof author === "string" && author.trim().length > 0 &&
      author.length <= 120 && !/[<>\r\n\x00-\x1f]/.test(author))) return undefined;
  return { authors: data.authors.map(author => (author as string).trim()), license: data.license as SourceAttribution["license"], license_url: data.license_url as string };
}

export function getStoryAttributions(story: EditionStory) {
  return (story.supporting_sources || []).flatMap(source => {
    const attribution = parseSourceAttribution(source.attribution);
    if (!attribution) return [];
    try {
      if (!["https:", "http:"].includes(new URL(source.url).protocol)) return [];
    } catch { return []; }
    return [{ ...source, attribution }];
  });
}
