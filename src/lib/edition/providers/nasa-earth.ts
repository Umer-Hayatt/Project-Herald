import type { NewsProviderAdapter, FetchCandidatesOptions, FetchCandidatesResult, ProviderCandidate } from "./types";
import { field, plainText, readBoundedFeed, withoutMedia } from "./rss-text";
import { isNasaEarthArticleUrl, NASA_EARTH_POLICY_URL, parseSourceAttribution } from "../source-attribution";

/** Earth-path permission does not cover the rest of the NASA feed or third-party media. */
export class NasaEarthAdapter implements NewsProviderAdapter {
  readonly name = "nasa-earth";
  readonly defaultRefreshCalls = 1;
  readonly defaultOutputUse = "evaluation_only" as const;
  isConfigured(): boolean { return process.env.NASA_EARTH_ENABLED === "true"; }

  async fetchCandidates(options?: FetchCandidatesOptions): Promise<FetchCandidatesResult> {
    if (!this.isConfigured()) return { candidates: [], success: false, providerCalls: 0, error: "NASA Earth feed disabled" };
    try {
      const response = await fetch("https://www.nasa.gov/feed/", { headers: { "User-Agent": "Herald/1.0 (news feed reader)" }, signal: AbortSignal.timeout(10000), cache: "no-store", redirect: "error" });
      if (!response.ok) throw new Error("Feed unavailable");
      const xml = await readBoundedFeed(response);
      if (/<!DOCTYPE|<!ENTITY/i.test(xml) || !/<rss\b[^>]*version="2\.0"/.test(xml) || !xml.trim().endsWith("</rss>") || !/<language>en(?:-US)?<\/language>/i.test(xml)) throw new Error("Unsupported feed");
      const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
      if (items.length > 50 || items.length !== (xml.match(/<item>/g) || []).length || items.length !== (xml.match(/<\/item>/g) || []).length) throw new Error("Invalid items");
      const now = options?.now || new Date();
      const candidates: ProviderCandidate[] = [];
      for (const [, item] of items) {
        const url = field(item, "link"), title = field(item, "title"), date = field(item, "pubDate"), content = field(item, "content:encoded");
        if (!url || !isNasaEarthArticleUrl(url) || !title || title.length > 500 || !date || !content) continue;
        const published = Date.parse(date);
        if (!Number.isFinite(published) || published < now.getTime() - 48 * 3600000 || published > now.getTime() + 900000) continue;
        // Check exceptions before removing media so restrictions cannot hide in captions.
        if (/©|&copy;|copyright|all\s+rights\s+reserved|used\s+with\s+permission|originally\s+published|republish|creativecommons|licensed\s+under/i.test(plainText(content))) continue;
        const paragraphs = [...withoutMedia(content).matchAll(/<p\b[^>]*class=["']wp-block-paragraph["'][^>]*>([\s\S]*?)<\/p>/gi)].map(m => plainText(m[1]));
        const creditIndex = paragraphs.findIndex(p => /\bStory by [^.]+\.$/.test(p));
        if (creditIndex < 1) continue;
        const author = paragraphs[creditIndex].match(/\bStory by ([^.]+)\.$/)?.[1];
        const attribution = parseSourceAttribution({ authors: [author], license: "NASA Earth reuse policy", license_url: NASA_EARTH_POLICY_URL });
        if (!attribution) continue;
        const text = paragraphs.slice(0, creditIndex).filter(p => p.length >= 100 && !/\b(?:maps?|images?|shades) (?:above|below|show|depict|of|indicate)/i.test(p)).join(" ");
        const description = text.length > 3000 ? text.slice(0, 3000).replace(/\s+\S*$/, "") : text;
        if (description.length < 120) continue;
        candidates.push({ id: `nasa-earth:${new URL(url).pathname}`, title: plainText(title), description, snippet: null, url, image_url: null,
          publisher: "NASA Earth Observatory", published_at: new Date(published).toISOString(), retrieved_at: now.toISOString(), language: "en",
          categories: ["science"], locale: null, provider: this.name, event_geography: [],
          output_use: process.env.NASA_EARTH_PUBLIC_REPORTING_ENABLED === "true" ? "commercial" : this.defaultOutputUse,
          raw: { source_attribution: attribution } });
        if (candidates.length >= Math.min(10, Math.max(1, options?.limit ?? 10))) break;
      }
      return { candidates, success: true, providerCalls: 1 };
    } catch { return { candidates: [], success: false, providerCalls: 1, error: "NASA Earth feed unavailable or unsupported" }; }
  }
}
