import Link from "next/link";
import { Header } from "@/components/header";
import { createClient } from "@/lib/supabase/server";
import { getStoryImageUrl } from "@/lib/edition/images";
import type { SourceArticle } from "@/lib/edition/types";
import { filterEligibleArticles } from "@/lib/edition/content-quality";

export const dynamic = "force-dynamic";

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

export default async function Home() {
  let articles: SourceArticle[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("source_articles")
      .select("*")
      .not("publisher", "in", '("Herald Verified Wire","Fake","Probe")')
      .order("published_at", { ascending: false })
      .limit(32);
    if (data && data.length > 0) {
      articles = filterEligibleArticles(data as SourceArticle[], {
        now: new Date(),
        maxAgeHours: 48,
      }).slice(0, 16);
    }
  } catch {
    // If database is temporarily unreachable, fallback gracefully
  }

  const heroArticle = articles[0];
  const spotlightArticle = articles.length > 1 ? articles[1] : null;
  const featuredArticles = articles.slice(2, 7);
  const latestArticles = articles.slice(7, 13);
  const trendingArticles = articles.slice(1, 5);

  return (
    <>
      <Header />
      <main id="main" className="landing">
        <div className="landing-copy">
          <h1>
            The world,
            <br />
            edited for you.
          </h1>
          <p className="lede">
            A daily paper shaped by your interests, with important stories
            beyond them.
          </p>
          <Link className="button" href="/login">
            Create my paper{" "}
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M3 13 13 3M4 3h9v9"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </Link>
          <p className="small-note">
            Start with Google. Make it yours in a minute.
          </p>
        </div>
        <aside className="art-space" aria-label="Illustrative paper preview">
          <div className="paper-object">
            <span className="paper-masthead">Herald.</span>
            <div className="paper-rule" />
            <h2>
              A wider view.
              <br />A little more you.
            </h2>
            <p>
              Your interests set the direction. A different perspective makes
              the paper.
            </p>
            <div className="paper-rule" />
            <span className="small-note">Your daily reading ritual</span>
          </div>
          <p className="art-caption">Illustrative preview · not a live Edition</p>
        </aside>
      </main>

      {/* Visual Magazine Editorial Showcase */}
      {articles.length > 0 && (
        <section className="edition-container" style={{ paddingTop: 0, marginTop: "1rem" }} aria-label="Today’s news preview">
          {/* Top Showcase: Hero Story & Spotlight */}
          {heroArticle && (
            <div className="edition-hero-grid">
              <article
                className="story-card-hero"
                style={{
                  backgroundImage: `linear-gradient(to top, rgba(26, 36, 46, 0.96) 0%, rgba(35, 47, 59, 0.75) 45%, rgba(41, 55, 68, 0.35) 100%), url(${getStoryImageUrl(heroArticle.categories[0], heroArticle.image_url)})`,
                }}
              >
                <div className="hero-content">
                  <div className="hero-badges">
                    <span className="hero-pill-badge">Editor’s Choice</span>
                    <span className="hero-pill-badge secondary">{heroArticle.categories[0] || "Featured"}</span>
                  </div>

                  <h2 className="hero-title">{heroArticle.title}</h2>
                  <p className="hero-excerpt">{heroArticle.snippet || heroArticle.description}</p>

                  <div className="hero-meta-row">
                    <a
                      href={heroArticle.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hero-read-link"
                    >
                      <span className="arrow-circle">→</span> Read Story · {heroArticle.publisher}
                    </a>
                    {heroArticle.published_at && (
                      <span className="hero-time">· {formatRelativeTime(heroArticle.published_at)}</span>
                    )}
                  </div>
                </div>
              </article>

              <div className="edition-spotlight-column">
                {spotlightArticle && (
                  <div className="spotlight-card">
                    <div className="spotlight-accent-bar">
                      <span style={{ color: "var(--orange)" }}>|</span>
                      <span>Featured Perspective</span>
                    </div>
                    <h3 className="spotlight-title">{spotlightArticle.title}</h3>
                    <img
                      src={getStoryImageUrl(spotlightArticle.categories[0], spotlightArticle.image_url)}
                      alt=""
                      className="spotlight-image"
                      loading="lazy"
                    />
                    <p className="spotlight-excerpt">
                      {spotlightArticle.snippet || spotlightArticle.description}
                    </p>
                    <div className="spotlight-stats-box">
                      <span>Publisher: {spotlightArticle.publisher}</span>
                      <a
                        href={spotlightArticle.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-link"
                        style={{ fontWeight: 600 }}
                      >
                        Read reporting ↗
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Featured Stories Row */}
          {featuredArticles.length > 0 && (
            <div className="featured-stories-section">
              <div className="featured-header-row">
                <h2 className="featured-title-bar">
                  <span className="featured-accent-pipe">|</span> Featured Stories
                </h2>
              </div>

              <div className="featured-cards-grid">
                {featuredArticles.map((feat) => {
                  const featImg = getStoryImageUrl(feat.categories[0], feat.image_url);
                  return (
                    <a
                      key={feat.id || feat.external_id}
                      href={feat.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="featured-card"
                      style={{
                        backgroundImage: `linear-gradient(to top, rgba(26, 36, 46, 0.95) 0%, rgba(35, 47, 59, 0.45) 50%, rgba(41, 55, 68, 0.2) 100%), url(${featImg})`,
                      }}
                    >
                      <span className="featured-card-category">{feat.categories[0] || "News"}</span>
                      <h3 className="featured-card-title">{feat.title}</h3>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Two-Column Editorial: The Latest + Trending Sidebar */}
          <div className="edition-main-grid">
            <div className="edition-main-content">
              <h2 className="edition-section-title">
                <span style={{ color: "var(--orange)", marginRight: "0.4rem" }}>|</span>
                The Latest News
              </h2>

              <div className="story-feed">
                {latestArticles.map((item, idx) => {
                  const itemImg = getStoryImageUrl(item.categories[0], item.image_url);
                  const relTime = formatRelativeTime(item.published_at);
                  return (
                    <article key={item.id || item.external_id} className="story-card-standard">
                      <div className="story-card-body">
                        <div className="story-image-wrap">
                          <img
                            src={itemImg}
                            alt=""
                            loading="lazy"
                            className="story-thumbnail"
                          />
                          <span className="story-image-category-pill">{item.categories[0] || "News"}</span>
                        </div>

                        <div className="story-details">
                          <div className="story-meta-row">
                            <span className="story-pos-badge" aria-hidden="true">{idx + 1}</span>
                            <span className="story-category-pill">{item.categories[0] || "General"}</span>
                            <span aria-hidden="true">·</span>
                            <span className="story-publisher">{item.publisher}</span>
                            {relTime && <><span aria-hidden="true">·</span><span>{relTime}</span></>}
                          </div>

                          <h3 className="story-title" style={{ fontSize: "1.35rem" }}>{item.title}</h3>
                          <p className="story-excerpt">{item.snippet || item.description}</p>

                          <div className="story-actions">
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="source-link"
                              aria-label={`Read original reporting from ${item.publisher} (opens in new tab)`}
                            >
                              Read original reporting ↗
                            </a>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <aside className="edition-sidebar" aria-label="Trending perspectives">
              {trendingArticles.length > 0 && (
                <div className="trending-card">
                  <h3 className="trending-header">
                    <span>On Trending</span>
                    <span aria-hidden="true">🔥</span>
                  </h3>
                  <div className="trending-list">
                    {trendingArticles.map((trend, index) => {
                      const timeAgo = formatRelativeTime(trend.published_at);
                      return (
                        <a
                          key={trend.id || trend.external_id}
                          href={trend.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="trending-item"
                        >
                          <span className="trending-num">#{index + 1}</span>
                          <div className="trending-info">
                            <h4 className="trending-title">{trend.title}</h4>
                            <span className="trending-meta">
                              {timeAgo ? `${timeAgo} · ` : ""}{trend.publisher}
                            </span>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}


              <div className="cta-banner-card">
                <h3 className="cta-banner-title">Become a Herald Reader</h3>
                <p className="cta-banner-text">
                  A finite daily paper shaped by your interests, with room for perspective.
                </p>
                <Link href="/login" className="button" style={{ background: "var(--orange)", color: "#ffffff", border: "none" }}>
                  Join Now
                </Link>
              </div>
            </aside>
          </div>
        </section>
      )}

      <footer className="site-footer">
        <span>One daily paper. Room for perspective.</span>
        <span>Herald · A little perspective, daily.</span>
      </footer>
    </>
  );
}
