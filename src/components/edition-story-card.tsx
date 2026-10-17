"use client";

import type { EditionStory } from "@/lib/edition/types";
import { StoryFeedbackControls } from "@/components/story-feedback-controls";
import { getStoryImageUrl } from "@/lib/edition/images";

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
  subStories = [],
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
  const imageUrl = getStoryImageUrl(story.category, story.image_url);
  const categoryLabel = story.topics?.length ? story.topics.join(" · ") : story.category;

  if (variant === "hero") {
    return (
      <article
        id={`story-${story.position}`}
        className="story-card story-card-hero"
        aria-label={`Lead Story ${story.position}: ${story.title}`}
        style={{ backgroundImage: `linear-gradient(to top, rgba(26, 36, 46, 0.96) 0%, rgba(35, 47, 59, 0.75) 45%, rgba(41, 55, 68, 0.35) 100%), url(${imageUrl})` }}
      >
        <div className="hero-content">
          <div className="hero-badges">
            <span className="hero-pill-badge">Editor’s Choice</span>
            <span className="hero-pill-badge secondary">{categoryLabel}</span>
          </div>

          <h2 className="story-title hero-title">{story.title}</h2>
          <p className="story-excerpt hero-excerpt">{story.briefing || story.excerpt}</p>

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

          {subStories.length > 0 && (
            <div className="hero-substories-bar" aria-label="Quick jump to other stories">
              {subStories.slice(0, 4).map((sub) => (
                <a
                  key={sub.id || sub.position}
                  href={`#story-${sub.position}`}
                  className="hero-substory-tab"
                  title={sub.title}
                >
                  <span className="substory-num">{sub.position}</span>
                  <span className="substory-title-snippet">{sub.title}</span>
                </a>
              ))}
            </div>
          )}
        </div>
        <div style={{ marginTop: "1rem" }}>
          <StoryFeedbackControls storyId={story.id || ""} />
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
        <div className="story-image-wrap">
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            className="story-thumbnail"
            onError={(e) => {
              // Graceful fallback to category photography
              (e.currentTarget as HTMLImageElement).src = getStoryImageUrl("general");
            }}
          />
          <span className="story-image-category-pill">{story.category}</span>
        </div>

        <div className="story-details">
          <div className="story-meta-row">
            <span className="story-pos-badge" aria-hidden="true">{story.position}</span>
            <span className="story-category-pill">{categoryLabel}</span>
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
          <p className="story-excerpt">{story.briefing || story.excerpt}</p>
          {story.why_it_matters && (
            <p className="story-importance">
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
