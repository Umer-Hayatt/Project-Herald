import { parseSourceAttribution } from "@/lib/edition/source-attribution";

export function SourceCredit({ source, attribution, displayedTitle }: {
  source: { title: string; url: string; publisher: string };
  attribution: unknown;
  displayedTitle?: string;
}) {
  const credit = parseSourceAttribution(attribution);
  if (!credit) return null;
  try {
    if (!["https:", "http:"].includes(new URL(source.url).protocol)) return null;
  } catch { return null; }
  return (
    <p className="source-attribution">
      Excerpted or adapted{source.title !== displayedTitle ? ` from “${source.title}”` : ""},{" "}
      by {credit.authors.join(", ")}, published by{" "}
      <a href={source.url} target="_blank" rel="noopener noreferrer">{source.publisher}</a>.{" "}
      <a href={credit.license_url} target="_blank" rel="noopener noreferrer">{credit.license}</a>.
    </p>
  );
}
