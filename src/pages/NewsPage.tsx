import { useRef, useEffect, useCallback } from 'react';
import { NewsShell } from '@/components/news/NewsShell';

type NewsCategory = 'all' | 'alphasec-services' | 'update-logs' | 'blog';

const CATEGORY_LABELS: Record<NewsCategory, string> = {
  'all': 'News',
  'alphasec-services': 'AlphaSec Services',
  'update-logs': 'Update Logs',
  'blog': 'Blog',
};

const HERO = {
  label: 'Featured',
  title: 'Alpha Control: The Galaxy Map Platform Redefining Strategic Command',
  excerpt: 'From real-time fleet tracking to interactive 3D star systems, Alpha Control delivers a command-grade operations dashboard built for the next era of galactic oversight. Explore how our latest release transforms raw intelligence into actionable strategy.',
};

const SAMPLE_CARDS: { category: NewsCategory; date: string; title: string; excerpt: string }[] = [
  { category: 'update-logs', date: 'Mar 5, 2026', title: 'Galaxy Map v2.4 — New Fleet Positioning Engine', excerpt: 'Overhauled fleet marker rendering with frame-perfect interpolation and reduced draw calls by 40%.' },
  { category: 'alphasec-services', date: 'Mar 3, 2026', title: 'Introducing Threat Intelligence Feeds', excerpt: 'Real-time anomaly detection now surfaces hostile fleet movements before they reach your sector.' },
  { category: 'blog', date: 'Feb 28, 2026', title: 'Designing for the Dark Side: Our UI Philosophy', excerpt: 'How we built an interface that feels like a military command console without sacrificing usability.' },
  { category: 'alphasec-services', date: 'Feb 22, 2026', title: 'Fleet Integrity Audits Now Available On-Demand', excerpt: 'Run comprehensive checks on any fleet composition to validate readiness, identify missing assets, and flag maintenance overdue vessels.' },
  { category: 'update-logs', date: 'Feb 19, 2026', title: 'Hotfix: Marker Z-Fighting on Dense Systems', excerpt: 'Resolved a rendering artifact where overlapping fleet markers would flicker on systems with more than 8 stationed fleets.' },
  { category: 'blog', date: 'Feb 15, 2026', title: 'From Prototype to Production: Lessons Shipping a WebGL App', excerpt: 'We shipped our first internal build in 3 weeks. Here is everything that broke, and how we fixed it before going live.' },
  { category: 'alphasec-services', date: 'Feb 8, 2026', title: 'Automated Incident Reports for Sector Commanders', excerpt: 'When an anomaly is detected, a full incident report is now generated automatically with threat assessment, historical context, and recommended response.' },
  { category: 'update-logs', date: 'Feb 5, 2026', title: 'Performance: Map Load Time Cut in Half', excerpt: 'Lazy loading of planet models and deferred texture uploads reduced initial map load from 4.2s to 1.9s on average hardware.' },
  { category: 'blog', date: 'Feb 1, 2026', title: 'State Management at Scale: Zustand in a Real-Time Dashboard', excerpt: 'How 4 Zustand stores handle concurrent updates from WebSocket feeds, user interactions, and background sync without breaking a sweat.' },
];

const FEED_ARTICLES: { category: NewsCategory; date: string; title: string; excerpt: string; callout?: string }[] = [
  { category: 'update-logs', date: 'Mar 6, 2026', title: 'Patch Notes: Civilian Traffic Layer Improvements', excerpt: 'Civilian shipping lanes now render with accurate hyperspace route data. Performance improved on low-end devices with adaptive LOD scaling.', callout: 'Requires map refresh to see changes.' },
  { category: 'alphasec-services', date: 'Mar 2, 2026', title: 'Custom Fleet Builder Now Supports Commander Assignments', excerpt: 'Assign named commanders to your custom fleets with full rank and faction metadata. Commander data syncs across all connected devices.' },
  { category: 'blog', date: 'Feb 27, 2026', title: 'Behind the Scenes: Building a 3D Star Map with React Three Fiber', excerpt: 'A deep dive into the technical challenges of rendering thousands of interactive markers in a WebGL scene without melting your GPU.' },
  { category: 'update-logs', date: 'Feb 24, 2026', title: 'System Detail View Redesign Shipped', excerpt: 'Planet info panels now show garrison strength, orbital assets, and faction control percentages at a glance. New animation system for panel transitions.' },
  { category: 'alphasec-services', date: 'Feb 20, 2026', title: 'New API Endpoint: Bulk Fleet Status Queries', excerpt: 'Retrieve status, position, and composition data for up to 500 fleets in a single request. Designed for integration with external command systems.' },
  { category: 'blog', date: 'Feb 14, 2026', title: 'Designing Accessible Interfaces for High-Density Data', excerpt: 'How we ensure that color-blind users, screen reader users, and keyboard-only navigators can operate the full command dashboard effectively.' },
  { category: 'update-logs', date: 'Feb 10, 2026', title: 'Camera System Overhaul: Smooth Transitions and Memory', excerpt: 'The map camera now remembers your last position and smoothly interpolates between bookmarked views with configurable easing curves.' },
];

const SAMPLE_SIDEBAR = [
  'Fleet marker click targets enlarged for mobile',
  'New admin dashboard metrics panel',
  'Supabase edge functions migrated to v2',
  'Faction emblem assets updated for all 12 factions',
  'Dark mode refinements on settings page',
  'Bug fix: map camera no longer drifts on idle',
];

function ArticleCard({ category, date, title, excerpt }: { category: NewsCategory; date: string; title: string; excerpt: string }) {
  return (
    <article className="news-page__card">
      <div className="news-page__card-image" aria-hidden="true" />
      <div className="news-page__card-body">
        <div className="news-page__card-meta">
          <span className="news-page__card-category">{CATEGORY_LABELS[category]}</span>
          <span className="news-page__card-date">{date}</span>
        </div>
        <h3 className="news-page__card-title">{title}</h3>
        <p className="news-page__card-excerpt">{excerpt}</p>
      </div>
    </article>
  );
}

function FeedArticle({ category, date, title, excerpt, callout }: { category: NewsCategory; date: string; title: string; excerpt: string; callout?: string }) {
  return (
    <article className="news-page__feed-article">
      <div className="news-page__feed-article-body">
        <div className="news-page__feed-article-meta">
          <span className="news-page__feed-article-category">{CATEGORY_LABELS[category]}</span>
          <span className="news-page__feed-article-date">{date}</span>
        </div>
        <h3 className="news-page__feed-article-title">{title}</h3>
        <p className="news-page__feed-article-excerpt">{excerpt}</p>
        {callout && <p className="news-page__feed-article-callout">{callout}</p>}
        <span className="news-page__feed-article-readmore">Read more →</span>
      </div>
      <div className="news-page__feed-article-image" aria-hidden="true" />
    </article>
  );
}

export function NewsPage() {
  const trackRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const offsetRef = useRef(0);
  const pausedRef = useRef(false);

  const animate = useCallback(() => {
    if (!pausedRef.current && trackRef.current) {
      offsetRef.current -= 0.2;
      const halfWidth = trackRef.current.scrollWidth / 2;
      if (Math.abs(offsetRef.current) >= halfWidth) {
        offsetRef.current = 0;
      }
      trackRef.current.style.transform = `translateX(${offsetRef.current}px)`;
    }
    animationRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [animate]);

  return (
    <NewsShell>
      <section className="news-page__hero" aria-label="Featured story">
        <div className="news-page__hero-text">
          <span className="news-page__hero-label">{HERO.label}</span>
          <h2 className="news-page__hero-title">{HERO.title}</h2>
          <p className="news-page__hero-excerpt">{HERO.excerpt}</p>
        </div>
        <div className="news-page__hero-image" aria-hidden="true" />
      </section>

      <section
        className="news-page__carousel"
        aria-label="Recent stories"
        onMouseEnter={() => { pausedRef.current = true; }}
        onMouseLeave={() => { pausedRef.current = false; }}
      >
        <div className="news-page__carousel-track" ref={trackRef}>
          {[...SAMPLE_CARDS, ...SAMPLE_CARDS].map((card, i) => (
            <ArticleCard key={`card-${i}`} {...card} />
          ))}
        </div>
      </section>

      <section className="news-page__feed">
        <h2 className="news-page__feed-section-title">Latest</h2>

        <div className="news-page__feed-content" role="region">
          <div className="news-page__feed-main">
            {FEED_ARTICLES.map((article, i) => (
              <FeedArticle key={`latest-${i}`} {...article} />
            ))}
          </div>

          <aside className="news-page__sidebar" aria-label="The latest headlines">
            <h3 className="news-page__sidebar-title">The Latest</h3>
            <ul className="news-page__sidebar-list">
              {SAMPLE_SIDEBAR.map((headline, i) => (
                <li key={i} className="news-page__sidebar-item">{headline}</li>
              ))}
            </ul>
          </aside>
        </div>
      </section>
    </NewsShell>
  );
}
