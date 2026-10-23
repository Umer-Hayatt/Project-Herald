import type { EditionStory, SourceAttribution } from "./types";

export const CC_BY_3_LICENSE_URL = "https://creativecommons.org/licenses/by/3.0/";

/** Keep only explicit, complete credits; never infer a licence from a publisher name. */
export function parseSourceAttribution(value: unknown): SourceAttribution | undefined {
  if (!value || typeof value !== "object") return undefined;
  const data = value as Record<string, unknown>;
  if (data.license !== "CC BY 3.0" || data.license_url !== CC_BY_3_LICENSE_URL ||
    !Array.isArray(data.authors) || data.authors.length < 1 || data.authors.length > 8 ||
    !data.authors.every(author => typeof author === "string" && author.trim().length > 0 &&
      author.length <= 120 && !/[<>\r\n\x00-\x1f]/.test(author))) return undefined;
  return { authors: data.authors.map(author => (author as string).trim()), license: "CC BY 3.0", license_url: CC_BY_3_LICENSE_URL };
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
