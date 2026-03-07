import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Footer } from '@/components/Footer';

type NewsCategory = 'all' | 'alphasec-services' | 'update-logs' | 'blog' | 'news';

const CATEGORIES: { id: NewsCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'alphasec-services', label: 'AlphaSec Services' },
  { id: 'update-logs', label: 'Update Logs' },
  { id: 'blog', label: 'Blog' },
  { id: 'news', label: 'News' },
];

function ArticleCardPlaceholder() {
  return (
    <article className="news-page__card">
      <div className="news-page__card-image" aria-hidden="true" />
      <div className="news-page__card-body">
        <div className="news-page__card-meta">
          <span className="news-page__card-category" />
          <span className="news-page__card-date" />
        </div>
        <h3 className="news-page__card-title" />
        <p className="news-page__card-excerpt" />
      </div>
    </article>
  );
}

function FeedArticlePlaceholder() {
  return (
    <article className="news-page__feed-article">
      <div className="news-page__feed-article-body">
        <div className="news-page__feed-article-meta">
          <span className="news-page__feed-article-category" />
          <span className="news-page__feed-article-date" />
        </div>
        <h3 className="news-page__feed-article-title" />
        <p className="news-page__feed-article-excerpt" />
        <p className="news-page__feed-article-callout" />
        <span className="news-page__feed-article-readmore" />
      </div>
      <div className="news-page__feed-article-image" aria-hidden="true" />
    </article>
  );
}

export function NewsPage() {
  const [activeCategory, setActiveCategory] = useState<NewsCategory>('all');
  const [activeTab, setActiveTab] = useState<'latest' | 'popular'>('latest');

  return (
    <main className="news-page" aria-label="AlphaSec News">
      <div className="news-page__layer news-page__layer--base" aria-hidden="true" />
      <div className="news-page__layer news-page__layer--veil" aria-hidden="true" />

      <div className="news-page__content">
        <header className="news-page__header">
          <div className="news-page__header-left">
            <Link to="/" className="news-page__back-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5" />
                <path d="m12 19-7-7 7-7" />
              </svg>
              Home
            </Link>
            <h1 className="news-page__brand">AlphaSec News</h1>
          </div>
        </header>

        <nav className="news-page__categories" aria-label="News categories">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`news-page__category-pill${activeCategory === cat.id ? ' news-page__category-pill--active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </nav>

        <section className="news-page__hero" aria-label="Featured story">
          <div className="news-page__hero-text">
            <span className="news-page__hero-label">Featured</span>
            <div className="news-page__hero-title" />
            <div className="news-page__hero-excerpt" />
          </div>
          <div className="news-page__hero-image" aria-hidden="true" />
        </section>

        <section className="news-page__grid" aria-label="Recent stories">
          {Array.from({ length: 4 }).map((_, i) => (
            <ArticleCardPlaceholder key={i} />
          ))}
        </section>

        <section className="news-page__feed">
          <div className="news-page__feed-tabs" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === 'latest'}
              className={`news-page__feed-tab${activeTab === 'latest' ? ' news-page__feed-tab--active' : ''}`}
              onClick={() => setActiveTab('latest')}
            >
              Latest
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'popular'}
              className={`news-page__feed-tab${activeTab === 'popular' ? ' news-page__feed-tab--active' : ''}`}
              onClick={() => setActiveTab('popular')}
            >
              Popular
            </button>
          </div>

          <div className="news-page__feed-content" role="tabpanel">
            <div className="news-page__feed-main">
              {Array.from({ length: 5 }).map((_, i) => (
                <FeedArticlePlaceholder key={i} />
              ))}
            </div>

            <aside className="news-page__sidebar" aria-label="The latest headlines">
              <h3 className="news-page__sidebar-title">The Latest</h3>
              <ul className="news-page__sidebar-list">
                {Array.from({ length: 6 }).map((_, i) => (
                  <li key={i} className="news-page__sidebar-item" />
                ))}
              </ul>
            </aside>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
