"use client";

import type { EditionStory } from "@/lib/edition/types";
import { StoryFeedbackControls } from "@/components/story-feedback-controls";
import { useState } from "react";
import { getStoryAttributions } from "@/lib/edition/source-attribution";

function SourceCredits({ story }: { story: EditionStory }) {
  return getStoryAttributions(story).map(source => (
    <p className="source-attribution" key={source.url}>
      Excerpted or adapted{source.title !== story.title ? ` from “${source.title}”` : ""} from{" "}
      <a href={source.url} target="_blank" rel="noopener noreferrer">{source.publisher}</a>{" "}
      by {source.attribution.authors.join(", ")}.{" "}
      <a href={source.attribution.license_url} target="_blank" rel="noopener noreferrer">{source.attribution.license}</a>.
    </p>
  ));
}

function formatRelativeTime(publishedAt: string): string {
  const publishedMs = Date.parse(publishedAt);
  if (!Number.isFinite(publishedMs)) return "";
  const diffHours = Math.round((Date.now() - publishedMs) / 3600000);
  if (diffHours <= 0) return "Just now";
  if (diffHours === 1) return "1 hour ago";
  if (diffHours < 24) return `${diffHours} hours ago`;
  const days = Math.floor(diffHours / 24);
  return days === 1 ? "Yesterday" : `${days} days ago`;
}

export function EditionStoryCard({
  story,
  totalStories,
  variant = "standard",
}: {
  story: EditionStory;
  totalStories: number;
  variant?: "hero" | "standard" | "featured";
  subStories?: EditionStory[];
}) {
  const nextStoryPos = story.position + 1;
  const hasNextStory = nextStoryPos <= totalStories;
  const skipHref = hasNextStory ? `#story-${nextStoryPos}` : "#edition-end";
  const skipLabel = hasNextStory ? `Skip to story ${nextStoryPos}` : "Finish reading";
  const relativeTime = formatRelativeTime(story.published_at);
  const sources = story.supporting_sources?.length
    ? story.supporting_sources
    : [{ title: story.title, url: story.source_url, publisher: story.publisher }];
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const imageUrl = story.image_url && story.image_url !== failedImageUrl ? story.image_url : null;
  const categoryLabel = story.topics?.length ? story.topics.join(" · ") : story.category;

  if (variant === "hero") {
    return (
      <article
        id={`story-${story.position}`}
        className="story-card story-card-hero"
        aria-label={`Lead Story ${story.position}: ${story.title}`}
        style={{ backgroundImage: `linear-gradient(to top, rgba(26, 36, 46, 0.96) 0%, rgba(35, 47, 59, 0.75) 45%, rgba(41, 55, 68, 0.35) 100%)${imageUrl ? `, url(${JSON.stringify(imageUrl)})` : ""}` }}
      >
        <div className="hero-content">
          <div className="hero-badges">
            <span className="hero-pill-badge">Lead Story</span>
            <span className="hero-pill-badge secondary">{categoryLabel}</span>
            {story.is_update && (
              <span className="hero-pill-badge update" style={{ background: "#d97706", color: "#fff" }}>
                Developing Update
              </span>
            )}
          </div>

          <h2 className="story-title hero-title">{story.title}</h2>
          <SourceCredits story={story} />
          <p className="story-excerpt story-briefing hero-excerpt">{story.briefing || story.excerpt}</p>
          {story.update_explanation && (
            <p className="story-update-explanation hero-update-explanation" style={{ color: "#fef08a", background: "rgba(120, 53, 15, 0.4)", padding: "0.35rem 0.65rem", borderRadius: "4px", margin: "0.35rem 0", fontSize: "0.85rem" }}>
              <strong>Follow-up:</strong> {story.update_explanation}
            </p>
          )}
          {story.why_it_matters && (
            <p className="story-importance story-why-it-matters hero-importance" style={{ color: "#e2e8f0", background: "rgba(15, 23, 42, 0.6)", padding: "0.5rem 0.75rem", borderRadius: "6px", margin: "0.5rem 0" }}>
              <strong style={{ color: "var(--orange, #f97316)" }}>Why it matters:</strong> {story.why_it_matters}
            </p>
          )}

          {sources.length > 1 && (
            <details className="supporting-sources hero-supporting-sources" style={{ margin: "0.5rem 0" }}>
              <summary style={{ color: "#e5e7eb", cursor: "pointer" }}>{sources.length} supporting reports</summary>
              <ul style={{ background: "rgba(15, 23, 42, 0.95)", border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: "6px", padding: "0.5rem 0.75rem", margin: "0.25rem 0" }}>
                {sources.map((source) => (
                  <li key={source.id || source.url} style={{ margin: "0.25rem 0" }}>
                    <a href={source.url} target="_blank" rel="noopener noreferrer" style={{ color: "#93c5fd", textDecoration: "underline" }}>
                      {source.publisher}: {source.title} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          )}

          <div className="hero-meta-row">
            <a
              href={sources[0].url}
              target="_blank"
              rel="noopener noreferrer"
              className="source-link hero-read-link"
              aria-label={`Read story from ${sources[0].publisher} (opens in new tab)`}
            >
              <span className="arrow-circle">→</span> Read Story · {story.publisher}
            </a>
            {relativeTime && <span className="hero-time">· {relativeTime}</span>}
            <a href={skipHref} className="skip-btn hero-skip-btn" aria-label={skipLabel}>
              {skipLabel} ↓
            </a>
          </div>

          <div className="hero-feedback-wrap" style={{ marginTop: "0.75rem" }}>
            <StoryFeedbackControls storyId={story.id || ""} />
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      id={`story-${story.position}`}
      className="story-card story-card-standard"
      aria-label={`Story ${story.position}: ${story.title}`}
    >
      <div className="story-card-body">
        {imageUrl && <div className="story-image-wrap">
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            className="story-thumbnail"
            onError={() => setFailedImageUrl(imageUrl)}
          />
          <span className="story-image-category-pill">{story.category}</span>
        </div>}

        <div className="story-details">
          <div className="story-meta-row">
            <span className="story-pos-badge" aria-hidden="true">{story.position}</span>
            <span className="story-category-pill">{categoryLabel}</span>
            {story.is_update && (
              <span
                className="story-update-badge"
                style={{
                  background: "#fef3c7",
                  color: "#92400e",
                  border: "1px solid #fde68a",
                  padding: "0.15rem 0.5rem",
                  borderRadius: "9999px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                }}
              >
                Developing Update
              </span>
            )}
            <span aria-hidden="true">·</span>
            <span className="story-publisher">{story.publisher}</span>
            {relativeTime && <><span aria-hidden="true">·</span><span>{relativeTime}</span></>}
            {story.briefing_source && story.briefing_source !== "gemini" && (
              <span className="story-source-badge">
                {story.briefing_source === "publisher_excerpt" ? "Publisher excerpt" : "Publisher headline"}
              </span>
            )}
          </div>

          <h3 className="story-title">{story.title}</h3>
          <SourceCredits story={story} />
          <p className="story-excerpt story-briefing">{story.briefing || story.excerpt}</p>
          {story.update_explanation && (
            <p className="story-update-explanation" style={{ fontSize: "0.85rem", color: "#b45309", margin: "0.35rem 0", fontStyle: "italic", background: "#fefce8", padding: "0.35rem 0.65rem", borderRadius: "4px" }}>
              <strong>Follow-up:</strong> {story.update_explanation}
            </p>
          )}
          {story.why_it_matters && (
            <p className="story-importance story-why-it-matters">
              <strong>Why it matters:</strong> {story.why_it_matters}
            </p>
          )}

          <div className="story-actions">
            {sources.length === 1 ? (
              <a
                href={sources[0].url}
                target="_blank"
                rel="noopener noreferrer"
                className="source-link"
                aria-label={`Read original reporting from ${sources[0].publisher} (opens in new tab)`}
              >
                Read original reporting ↗
              </a>
            ) : (
              <details className="supporting-sources">
                <summary>{sources.length} supporting reports</summary>
                <ul>
                  {sources.map((source) => (
                    <li key={source.id || source.url}>
                      <a href={source.url} target="_blank" rel="noopener noreferrer">
                        {source.publisher}: {source.title} ↗
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
            )}
            <a href={skipHref} className="skip-btn" aria-label={skipLabel}>
              {skipLabel} ↓
            </a>
          </div>
          <StoryFeedbackControls storyId={story.id || ""} />
        </div>
      </div>
    </article>
  );
}
