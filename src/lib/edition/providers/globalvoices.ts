import type { NewsProviderAdapter, FetchCandidatesOptions, FetchCandidatesResult, ProviderCandidate } from "./types";
import { CC_BY_3_LICENSE_URL, parseSourceAttribution, isGlobalVoicesArticleUrl } from "../source-attribution";
import { extractEventGeography } from "../geography";

const FEED_URL = "https://globalvoices.org/feed/";
import { decodeEntities, field, withoutMedia, plainText, readBoundedFeed } from "./rss-text";

export class GlobalVoicesAdapter implements NewsProviderAdapter {
  readonly name = "globalvoices";
  readonly defaultRefreshCalls = 1;
  readonly defaultOutputUse = "evaluation_only" as const;

  isConfigured(): boolean { return process.env.GLOBALVOICES_ENABLED === "true"; }

  async fetchCandidates(options?: FetchCandidatesOptions): Promise<FetchCandidatesResult> {
    if (!this.isConfigured()) return { candidates: [], success: false, providerCalls: 0, error: "Global Voices feed is disabled" };
    try {
      const response = await fetch(FEED_URL, { signal: AbortSignal.timeout(10000), cache: "no-store", redirect: "error" });
      if (!response.ok) throw new Error(`Feed HTTP ${response.status}`);
      const xml = await readBoundedFeed(response);
      if (/<!DOCTYPE|<!ENTITY/i.test(xml) || !/<rss\b[^>]*version="2\.0"/.test(xml) ||
        !xml.trim().endsWith("</rss>") || !/<language>en(?:-US)?<\/language>/i.test(xml)) throw new Error("Unsupported feed format");
      const now = options?.now || new Date();
      const candidates: ProviderCandidate[] = [];
      const itemCount = (xml.match(/<item>/g) || []).length;
      if (itemCount > 50 || itemCount !== (xml.match(/<\/item>/g) || []).length) throw new Error("Feed item limit or structure invalid");
      const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
      for (const [, item] of items) {
        const url = field(item, "link");
        const title = field(item, "title");
        const author = field(item, "dc:creator");
        const date = field(item, "pubDate");
        const content = field(item, "content:encoded");
        if (!url || !isGlobalVoicesArticleUrl(url) || !title || title.length > 500 || !author ||
          /^(guest contributor|gv contributor|global voices.*|anonymous|unknown)$/i.test(author.trim()) || !date || !content) continue;
        const attribution = parseSourceAttribution({ authors: [decodeEntities(author).trim()], license: "CC BY 3.0", license_url: CC_BY_3_LICENSE_URL });
        const publishedMs = Date.parse(date);
        if (!attribution || !Number.isFinite(publishedMs) || publishedMs > now.getTime() + 900000 ||
          publishedMs < now.getTime() - 48 * 3600000) continue;
        // WordPress inserts this exact self-credit into every RSS article. Only remove a verified self-link.
        const reporting = content.replace(/<p class=['"]originally-published['"]><small>Originally published on <a href=['"]([^'"]+)['"]>Global Voices<\/a><\/small><\/p>/g,
          (markup, originalUrl: string) => originalUrl === url ? " " : markup);
        // Conservative exclusion: never infer that republication/exception notices grant the same rights.
        // Check all visible notices before removing media/quotations; formatting must not hide restrictions.
        if (/all rights reserved|originally published|republish|reproduc(?:ed|tion) with|used with permission|copyright|licensed under|creativecommons\.org\/licenses|\bCC[ -]BY[ -](?:NC|ND|SA)\b/i.test(`${plainText(reporting)} ${reporting}`)) continue;
        const fullText = plainText(withoutMedia(reporting));
        const description = fullText.length > 3000 ? fullText.slice(0, 3000).replace(/\s+\S*$/, "") : fullText;
        if (description.length < 120) continue;
        const categories = [...item.matchAll(/<category>([\s\S]*?)<\/category>/g)].map(match => field(match[0], "category") || "");
        const { regions } = extractEventGeography(`${title} ${description}`);
        candidates.push({
          id: `gv:${new URL(url).pathname}`, title: plainText(title), description, snippet: null, url,
          image_url: null, publisher: "Global Voices", published_at: new Date(publishedMs).toISOString(), retrieved_at: now.toISOString(),
          language: "en", categories: categories.some(value => /technology|internet|digital activism/i.test(value)) ? ["technology"] : ["general"],
          locale: null, provider: this.name, event_geography: regions,
          output_use: process.env.GLOBALVOICES_PUBLIC_REPORTING_ENABLED === "true" ? "commercial" : this.defaultOutputUse,
          raw: { source_attribution: attribution },
        });
        if (candidates.length >= Math.min(10, Math.max(1, options?.limit ?? 10))) break;
      }
      return { candidates, success: true, providerCalls: 1 };
    } catch {
      return { candidates: [], success: false, providerCalls: 1, error: "Global Voices feed unavailable or unsupported" };
    }
  }
}
