export function feedbackSourceIdentities(story: {
  id: string;
  source_article_id: string | null;
  source_url: string;
  supporting_sources: unknown;
}) {
  const sources = Array.isArray(story.supporting_sources) ? story.supporting_sources : [];
  const identities = sources.flatMap((source: { id?: unknown; url?: unknown }) =>
    [source.id, source.url]
      .filter((value): value is string => typeof value === "string" && value.length > 0)
  );
  identities.push(story.source_article_id || "", story.source_url || "");
  const uniqueIdentities = [...new Set(identities.filter(Boolean))].sort();
  return uniqueIdentities.length ? uniqueIdentities : [story.id];
}
