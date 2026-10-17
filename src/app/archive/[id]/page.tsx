import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { createClient } from "@/lib/supabase/server";
import { getArchivedEditionById } from "@/lib/edition/archive";

function formatDisplayDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return dateStr;
  }
}

function formatRelativeTime(publishedAt: string): string {
  try {
    const pubMs = new Date(publishedAt).getTime();
    const diffHours = Math.round((Date.now() - pubMs) / (60 * 60 * 1000));
    if (diffHours <= 0) return "Just now";
    if (diffHours === 1) return "1 hour ago";
    if (diffHours < 24) return `${diffHours} hours ago`;
    const days = Math.floor(diffHours / 24);
    return days === 1 ? "Yesterday" : `${days} days ago`;
  } catch {
    return "";
  }
}

export default async function ArchivedEditionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const edition = await getArchivedEditionById(supabase, user.id, id);

  if (!edition) {
    return (
      <>
        <Header signedIn />
        <main id="main" className="edition-container">
          <div className="edition-empty-state">
            <h1>Edition unavailable or not found</h1>
            <p>
              We couldn’t find this preserved edition. It may not exist or belongs to another reader account.
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <Link href="/archive" className="button">
                Return to archive
              </Link>
              <Link href="/paper" className="secondary-button">
                Today’s Paper
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  const stories = edition.stories || [];
  const displayDate = formatDisplayDate(edition.edition_date);

  return (
    <>
      <Header signedIn />
      <main id="main" className="edition-container">
        <div style={{ marginBottom: "1.5rem" }}>
          <Link href="/archive" className="text-link" aria-label="Back to archive">
            ← Back to archive
          </Link>
        </div>

        <header className="edition-masthead-sub">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <span className="meta-chip highlight" style={{ fontSize: "0.8rem", textTransform: "uppercase" }}>
                Archived Edition
              </span>
            </div>
            <h1 className="edition-date-headline">{displayDate}</h1>
            <p style={{ color: "var(--muted)", margin: "0.25rem 0 0" }}>
              Preserved historical paper
            </p>
          </div>
          <div className="edition-meta-chips" aria-label="Edition details">
            <span className="meta-chip highlight">
              ~{edition.estimated_reading_minutes} min read
            </span>
            <span className="meta-chip">{stories.length} stories</span>
            <span className="meta-chip">{edition.word_count} words</span>
            <span className="meta-chip">{edition.reading_length} minutes</span>
          </div>
        </header>

        <section className="story-feed" aria-label={`Stories from ${displayDate}`}>
          {stories.map((story) => {
            const nextStoryPos = story.position + 1;
            const hasNextStory = nextStoryPos <= stories.length;
            const skipHref = hasNextStory
              ? `#story-${nextStoryPos}`
              : "#edition-end";
            const skipLabel = hasNextStory
              ? `Skip to story ${nextStoryPos}`
              : "Finish reading";
            const relativeTime = formatRelativeTime(story.published_at);

            return (
              <article
                key={story.id || story.position}
                id={`story-${story.position}`}
                className="story-card"
                aria-label={`Story ${story.position}: ${story.title}`}
              >
                <div className="story-meta-row">
                  <span className="story-pos-badge" aria-hidden="true">
                    {story.position}
                  </span>
                  <span className="story-category-pill">{story.category}</span>
                  <span aria-hidden="true">·</span>
                  <span className="story-publisher">{story.publisher}</span>
                  {relativeTime && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{relativeTime}</span>
                    </>
                  )}
                </div>

                <h2 className="story-title">{story.title}</h2>
                <p className="story-excerpt">{story.excerpt}</p>

                <div className="story-actions">
                  <a
                    href={story.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="source-link"
                    aria-label={`Read full reporting on ${story.publisher} (opens in new tab)`}
                  >
                    Read original reporting ↗
                  </a>
                  <a href={skipHref} className="skip-btn" aria-label={skipLabel}>
                    {skipLabel} ↓
                  </a>
                </div>
              </article>
            );
          })}
        </section>

        {/* Reserved art/motion region for Slice 8 */}
        <aside
          style={{
            margin: "4rem 0 2rem",
            padding: "2rem",
            background: "#f3efe6",
            border: "1px dashed var(--line)",
            borderRadius: "6px",
            textAlign: "center",
          }}
          aria-label="Illustration placeholder"
        >
          <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
            Reserved for final human-made comic artwork & animation
          </span>
        </aside>

        <footer id="edition-end" className="edition-footer-note">
          <p style={{ fontWeight: 600, fontSize: "1.2rem", margin: "0 0 0.5rem" }}>
            Preserved Edition: {displayDate}
          </p>
          <p style={{ color: "var(--muted)", margin: "0 0 1.5rem" }}>
            This paper is saved in your archive exactly as it appeared on the day it was published.
          </p>
          <div style={{ display: "flex", gap: "1.5rem", justifyContent: "center" }}>
            <Link href="/archive" className="text-link">
              ← Return to archive
            </Link>
            <Link href="/paper" className="text-link">
              Today’s Paper →
            </Link>
          </div>
        </footer>
      </main>
    </>
  );
}
