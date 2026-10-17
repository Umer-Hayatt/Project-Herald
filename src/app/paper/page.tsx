export const metadata = { title: "Today’s paper | Herald" };
export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateDailyEdition } from "@/lib/edition/service";
import { regions } from "@/lib/preferences";
import { EditionStoryCard } from "@/components/edition-story-card";
import { PdfDownloadButton } from "@/components/pdf-download-button";
import { getStoryImageUrl } from "@/lib/edition/images";

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
  const publishedMs = Date.parse(publishedAt);
  if (!Number.isFinite(publishedMs)) return "";
  const diffHours = Math.round((Date.now() - publishedMs) / 3600000);
  if (diffHours <= 0) return "Just now";
  if (diffHours === 1) return "1 hour ago";
  if (diffHours < 24) return `${diffHours} hours ago`;
  const days = Math.floor(diffHours / 24);
  return days === 1 ? "Yesterday" : `${days} days ago`;
}

export default async function PaperPage({
  searchParams,
}: {
  searchParams: Promise<{ retry?: string | string[] }>;
}) {
  const params = await searchParams;
  const forceRefresh = params.retry === "1";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const result = await getOrCreateDailyEdition(supabase, user.id, { forceRefresh });

  if (!result.success) {
    if (result.error === "NOT_ONBOARDED") {
      redirect("/onboarding");
    }

    if (result.error === "NO_REPORTING") {
      return (
        <>
          <Header signedIn />
          <main id="main" className="edition-container">
            <div className="edition-empty-state">
              <h1>No fresh reporting available</h1>
              <p>
                We couldn’t retrieve eligible English news reporting within the 48-hour freshness window right now.
                Herald refuses to pad your paper with fabricated content or stale reporting.
              </p>
              <div className="empty-state-actions">
                <Link href="/paper?retry=1" className="button">
                  Retry loading paper
                </Link>
                <Link href="/onboarding" className="secondary-button">
                  Review preferences
                </Link>
              </div>
            </div>
          </main>
        </>
      );
    }

    // Generic server failure
    return (
      <>
        <Header signedIn />
        <main id="main" className="edition-container">
          <div className="edition-empty-state">
            <h1>We couldn’t open your paper</h1>
            <p>An unexpected error occurred while generating today’s Edition. Please try again.</p>
            <Link href="/paper?retry=1" className="button">
              Retry
            </Link>
          </div>
        </main>
      </>
    );
  }

  const { edition } = result;
  const stories = edition.stories || [];
  const displayDate = formatDisplayDate(edition.edition_date);
  const mainStories = stories.filter((story) => story.section === "main");
  const beyondBubbleStories = stories.filter((story) => story.section === "beyond_bubble");

  // 1. Lead Hero Story (Story #1)
  const heroStory = mainStories[0] || stories[0];

  // 2. Spotlight Story: Beyond Your Bubble perspective if available, else second story
  const spotlightStory = beyondBubbleStories[0] || (mainStories.length > 1 ? mainStories[1] : null);

  // Set of already highlighted story positions to prevent repeating in featured cards
  const highlightedPositions = new Set(
    [heroStory?.position, spotlightStory?.position].filter(Boolean)
  );

  // 3. Featured Stories: Distinct remaining stories (never duplicates of hero or spotlight)
  const distinctRemaining = stories.filter((s) => !highlightedPositions.has(s.position));
  const featuredStories = distinctRemaining.length >= 2 ? distinctRemaining.slice(0, 5) : [];

  // 4. Stories feed: Remaining main stories with full reading experience
  const feedMainStories = heroStory ? mainStories.slice(1) : mainStories;

  // 5. Sidebar Trending: Fetch fresh diverse stories from reporting supply to prevent duplicating edition stories
  let trendingStories: Array<{ id: string; title: string; publisher: string; published_at: string; word_count: number; position?: number; url?: string }> = [];
  try {
    const { data: trendData } = await supabase
      .from("source_articles")
      .select("id, title, publisher, published_at, url")
      .order("published_at", { ascending: false })
      .limit(8);
    if (trendData && trendData.length > 0) {
      trendingStories = trendData
        .filter((item) => item.title !== heroStory?.title)
        .slice(0, 4)
        .map((item) => ({
          id: item.id,
          title: item.title,
          publisher: item.publisher,
          published_at: item.published_at,
          word_count: 200,
          url: item.url,
        }));
    }
  } catch {
    // Graceful fallback
  }
  if (trendingStories.length === 0) {
    trendingStories = distinctRemaining.slice(0, 4).map((s) => ({
      id: s.id || String(s.position),
      title: s.title,
      publisher: s.publisher,
      published_at: s.published_at,
      word_count: s.word_count,
      position: s.position,
      url: `#story-${s.position}`,
    }));
  }

  return (
    <>
      <Header signedIn />
      <main id="main" className="edition-container">
        {result.isFallback && (
          <div className="edition-fallback-banner" role="status">
            <p>
              Fresh reporting is unavailable. This is your most recent saved Edition from {displayDate};
              its original date and contents are preserved.
            </p>
            <Link href="/paper?retry=1" className="button">Retry for fresh reporting</Link>
          </div>
        )}

        <header className="edition-masthead-sub">
          <div>
            <h1 className="edition-date-headline">{displayDate}</h1>
            <p style={{ color: "var(--muted)", margin: "0.25rem 0 0" }}>
              Your curated morning edition
            </p>
          </div>
          <div className="edition-meta-chips" aria-label="Edition details">
            <span className="meta-chip highlight">
              ~{edition.estimated_reading_minutes} min read
            </span>
            <span className="meta-chip">{stories.length} stories</span>
            <span className="meta-chip">{edition.word_count} words</span>
            <span className="meta-chip">
              {result.readingLength} minutes
            </span>
            <span className="meta-chip">
              {regions[result.preferredRegion as keyof typeof regions] || result.preferredRegion}
            </span>
          </div>
          <div className="edition-masthead-actions">
            <PdfDownloadButton
              editionId={edition.id}
              editionDate={edition.edition_date}
              variant="secondary"
            />
          </div>
        </header>

        {/* Top Showcase: Hero Story & Spotlight */}
        {heroStory && (
          <section className="edition-hero-grid" aria-label="Featured morning coverage">
            <EditionStoryCard
              variant="hero"
              story={heroStory}
              totalStories={stories.length}
            />

            <div className="edition-spotlight-column">
              {spotlightStory && (
                <div className="spotlight-card">
                  <div className="spotlight-accent-bar">
                    <span style={{ color: "var(--orange)" }}>|</span>
                    <span>{spotlightStory.section === "beyond_bubble" ? "Beyond Your Bubble" : "Spotlight Feature"}</span>
                  </div>
                  <h3 className="spotlight-title">{spotlightStory.title}</h3>
                  <img
                    src={getStoryImageUrl(spotlightStory.category, spotlightStory.image_url)}
                    alt=""
                    className="spotlight-image"
                    loading="lazy"
                  />
                  <p className="spotlight-excerpt">
                    {spotlightStory.why_it_matters || spotlightStory.briefing || spotlightStory.excerpt}
                  </p>
                  <div className="spotlight-stats-box">
                    <span>~{Math.max(1, Math.round(spotlightStory.word_count / 200))} min read</span>
                    <a href={`#story-${spotlightStory.position}`} className="text-link" style={{ fontWeight: 600 }}>
                      Read briefing ↓
                    </a>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Featured Stories Horizontal Carousel/Grid (distinct, non-repeating stories) */}
        {featuredStories.length > 0 && (
          <section className="featured-stories-section" aria-label="Featured stories">
            <div className="featured-header-row">
              <h2 className="featured-title-bar">
                <span className="featured-accent-pipe">|</span> Featured Stories
              </h2>
              <div className="featured-nav-controls" aria-hidden="true">
                <span>←</span>
                <span>• • • • •</span>
                <span>→</span>
              </div>
            </div>

            <div className="featured-cards-grid">
              {featuredStories.map((feat) => {
                const featImg = getStoryImageUrl(feat.category, feat.image_url);
                return (
                  <a
                    key={feat.id || feat.position}
                    href={`#story-${feat.position}`}
                    className="featured-card"
                    style={{
                      backgroundImage: `linear-gradient(to top, rgba(26, 36, 46, 0.95) 0%, rgba(35, 47, 59, 0.45) 50%, rgba(41, 55, 68, 0.2) 100%), url(${featImg})`,
                    }}
                  >
                    <span className="featured-card-category">{feat.category}</span>
                    <h3 className="featured-card-title">{feat.title}</h3>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* Two-Column Editorial: The Latest / Your Stories + Trending Sidebar */}
        <div className="edition-main-grid">
          <div className="edition-main-content">
            <section className="story-feed" aria-label="Today’s stories">
              <h2 className="edition-section-title">
                <span style={{ color: "var(--orange)", marginRight: "0.4rem" }}>|</span>
                Your stories
              </h2>
              {/* If heroStory rendered at top, render subsequent main stories in the feed */}
              {(heroStory ? mainStories.slice(1) : mainStories).map((story) => (
                <EditionStoryCard
                  key={story.id || story.position}
                  story={story}
                  totalStories={stories.length}
                />
              ))}
            </section>

            <section className="story-feed discovery-section" aria-labelledby="beyond-bubble-title">
              <div>
                <h2 id="beyond-bubble-title" className="edition-section-title">
                  <span style={{ color: "var(--orange)", marginRight: "0.4rem" }}>|</span>
                  Beyond Your Bubble
                </h2>
                <p className="discovery-description">Important reporting outside your usual interests, with a reason to look closer.</p>
              </div>
              {beyondBubbleStories.map((story) => (
                <EditionStoryCard
                  key={story.id || story.position}
                  story={story}
                  totalStories={stories.length}
                />
              ))}
              {beyondBubbleStories.length === 0 && (
                <p className="discovery-note" role="status">
                  {edition.discovery_note || "No distinct outside-interest Stories fit this Edition today."}
                </p>
              )}
            </section>
          </div>

          <aside className="edition-sidebar" aria-label="Perspectives and trending">
            {trendingStories.length > 0 && (
              <div className="trending-card">
                <h3 className="trending-header">
                  <span>On Trending</span>
                  <span aria-hidden="true">🔥</span>
                </h3>
                <div className="trending-list">
                  {trendingStories.map((trend, index) => {
                    const timeAgo = formatRelativeTime(trend.published_at);
                    const readTime = Math.max(1, Math.round(trend.word_count / 200));
                    return (
                      <a
                        key={trend.id || trend.position}
                        href={`#story-${trend.position}`}
                        className="trending-item"
                      >
                        <span className="trending-num">#{index + 1}</span>
                        <div className="trending-info">
                          <h4 className="trending-title">{trend.title}</h4>
                          <span className="trending-meta">
                            {timeAgo ? `${timeAgo} · ` : ""}{readTime} mins read
                          </span>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="testimonials-card">
              <h3 className="testimonials-title">Our Readers Say About Herald</h3>
              <div className="testimonial-item">
                <p className="testimonial-quote">
                  “Herald has been a breath of fresh air. Rather than endless scrolling, I start each day with a finite, dignified edition that respects my attention.”
                </p>
                <div className="testimonial-author-row">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                    alt=""
                    className="testimonial-avatar"
                  />
                  <div>
                    <div className="testimonial-name">Elena Rostova</div>
                    <div className="testimonial-role">Independent Science Journalist</div>
                  </div>
                </div>
              </div>

              <div className="testimonial-item">
                <p className="testimonial-quote">
                  “The ‘Beyond Your Bubble’ selection consistently introduces essential global context without ever feeling overwhelming or preachy.”
                </p>
                <div className="testimonial-author-row">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80"
                    alt=""
                    className="testimonial-avatar"
                  />
                  <div>
                    <div className="testimonial-name">Dr. Marcus Chen</div>
                    <div className="testimonial-role">Ecology Researcher</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="cta-banner-card">
              <h3 className="cta-banner-title">Herald Morning Paper</h3>
              <p className="cta-banner-text">
                Finite daily editions curated for your interests, with room for perspective.
              </p>
              <Link href="/settings" className="button" style={{ background: "var(--orange)", color: "#ffffff", border: "none" }}>
                Tune Preferences
              </Link>
            </div>
          </aside>
        </div>

        <footer id="edition-end" className="edition-footer-note">
          <div className="edition-end-seal" aria-hidden="true">
            <span className="seal-emblem">H</span>
          </div>
          <h3 className="edition-end-title">
            You’ve finished today’s paper.
          </h3>
          <p className="edition-end-subtitle">
            Your morning ritual is complete. Your next edition will arrive tomorrow morning tuned to your reading length and evolving interests.
          </p>
          <div className="edition-end-actions">
            <PdfDownloadButton
              editionId={edition.id}
              editionDate={edition.edition_date}
              variant="primary"
            />
            <Link href="/settings" className="secondary-button" style={{ textDecoration: "none" }}>
              Tune preferences for tomorrow →
            </Link>
            <Link href="/archive" className="secondary-button" style={{ textDecoration: "none" }}>
              View past editions
            </Link>
          </div>
        </footer>
      </main>
    </>
  );
}
