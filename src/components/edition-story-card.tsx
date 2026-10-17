import type { EditionStory } from "@/lib/edition/types";
import { StoryFeedbackControls } from "@/components/story-feedback-controls";

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
}: {
  story: EditionStory;
  totalStories: number;
}) {
  const nextStoryPos = story.position + 1;
  const hasNextStory = nextStoryPos <= totalStories;
  const skipHref = hasNextStory ? `#story-${nextStoryPos}` : "#edition-end";
  const skipLabel = hasNextStory ? `Skip to story ${nextStoryPos}` : "Finish reading";
  const relativeTime = formatRelativeTime(story.published_at);
  const sources = story.supporting_sources?.length
    ? story.supporting_sources
    : [{ title: story.title, url: story.source_url, publisher: story.publisher }];

  return (
    <article
      id={`story-${story.position}`}
      className="story-card"
      aria-label={`Story ${story.position}: ${story.title}`}
    >
      <div className="story-meta-row">
        <span className="story-pos-badge" aria-hidden="true">{story.position}</span>
        <span className="story-category-pill">{story.topics?.length ? story.topics.join(" · ") : story.category}</span>
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
    </article>
  );
}
