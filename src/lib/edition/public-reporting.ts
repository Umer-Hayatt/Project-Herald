import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { filterEligibleArticles } from "./content-quality";
import type { SourceArticle } from "./types";

/** Collect eligible reporting before applying presentation limits, with bounded reads. */
export async function readEligiblePublicReporting(
  supabase: SupabaseClient,
  options: { limit: number; now: Date; excludeTitle?: string },
): Promise<SourceArticle[]> {
  if (!Number.isInteger(options.limit) || options.limit < 1 || options.limit > 32) return [];
  const accepted: SourceArticle[] = [];
  const pageSize = 32;
  const maxScanned = 256;
  const oldest = new Date(options.now.getTime() - 48 * 60 * 60 * 1000).toISOString();
  for (let offset = 0; offset < maxScanned; offset += pageSize) {
    const { data, error } = await supabase.from("source_articles")
      .select("*")
      .eq("raw_data->>output_use", "commercial")
      .gte("published_at", oldest)
      .not("publisher", "in", '("Herald Verified Wire","Fake","Probe")')
      .order("published_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + pageSize - 1);
    if (error || !data?.length) break;
    accepted.push(...filterEligibleArticles(data as SourceArticle[], {
      now: options.now, maxAgeHours: 48, requireCurrentProviderApproval: true,
    }).filter(article => article.title !== options.excludeTitle));
    if (accepted.length >= options.limit || data.length < pageSize) break;
  }
  return accepted.slice(0, options.limit);
}
