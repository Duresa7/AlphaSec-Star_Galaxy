import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { fetchLatestPublishedPosts } from '@/data/blogPosts';
import type { BlogPost } from '@/types/blog';
import { useAuthStore } from '@/store/authStore';

function formatPublishedDate(value: string | null): string {
  if (!value) return 'Unscheduled';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function BlogPage() {
  const heroImageUrl = `${import.meta.env.BASE_URL}homepage-bg.jpg`;
  const { isAdmin } = useAuthStore();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const nextPosts = await fetchLatestPublishedPosts();
      if (!mounted) return;
      setPosts(nextPosts);
      setIsLoading(false);
    };

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const tagOptions = useMemo(() => {
    const tags = new Set<string>();
    for (const post of posts) {
      for (const tag of post.tags) tags.add(tag);
    }
    return ['all', ...Array.from(tags).sort()];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return posts.filter((post) => {
      if (activeTag !== 'all' && !post.tags.includes(activeTag)) return false;
      if (!normalizedQuery) return true;
      return (
        post.title.toLowerCase().includes(normalizedQuery)
        || post.excerpt.toLowerCase().includes(normalizedQuery)
        || post.tags.some((tag) => tag.includes(normalizedQuery))
      );
    });
  }, [posts, query, activeTag]);

  return (
    <main
      className="alpha-blog"
      aria-label="Alpha Blog latest posts"
      style={{ '--portfolio-hero-bg-image': `url("${heroImageUrl}")` } as CSSProperties}
    >
      <div className="alpha-blog__layer alpha-blog__layer--base" aria-hidden="true" />
      <div className="alpha-blog__layer alpha-blog__layer--grid" aria-hidden="true" />
      <div className="alpha-blog__layer alpha-blog__layer--veil" aria-hidden="true" />

      <div className="alpha-blog__shell">
        <header className="alpha-blog__masthead">
          <div>
            <p className="alpha-blog__eyebrow">Public Dispatch</p>
            <h1 className="alpha-blog__title">Alpha Blog</h1>
            <p className="alpha-blog__subtitle">
              Latest posts, builds, and mission reports from Alpha Sec.
            </p>
          </div>
          <div className="alpha-blog__masthead-actions">
            {isAdmin && (
              <Link to="/blog/manage" className="alpha-blog__action alpha-blog__action--primary">
                Manage Posts
              </Link>
            )}
            <Link to="/" className="alpha-blog__action">
              Back to Frontpage
            </Link>
          </div>
        </header>

        <section className="alpha-blog__controls">
          <label className="alpha-blog__search-wrap" htmlFor="alpha-blog-search">
            <span className="alpha-blog__search-label">Search</span>
            <input
              id="alpha-blog-search"
              className="alpha-blog__search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
              }}
              placeholder="Search by title, excerpt, or tag"
            />
          </label>
          <div className="alpha-blog__tag-filter" role="tablist" aria-label="Filter by tag">
            {tagOptions.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`alpha-blog__tag-chip${activeTag === tag ? ' is-active' : ''}`}
                onClick={() => {
                  setActiveTag(tag);
                }}
              >
                {tag === 'all' ? 'All Tags' : tag}
              </button>
            ))}
          </div>
        </section>

        <section className="alpha-blog__list" aria-live="polite">
          {isLoading ? (
            <p className="alpha-blog__empty">Loading latest posts...</p>
          ) : filteredPosts.length === 0 ? (
            <p className="alpha-blog__empty">No blog posts matched your search yet.</p>
          ) : (
            filteredPosts.map((post) => (
              <article key={post.id} className="alpha-blog__card">
                <div className="alpha-blog__cover-wrap">
                  {post.coverImageUrl ? (
                    <img className="alpha-blog__cover" src={post.coverImageUrl} alt="" loading="lazy" />
                  ) : (
                    <div className="alpha-blog__cover alpha-blog__cover--placeholder" aria-hidden="true" />
                  )}
                </div>

                <div className="alpha-blog__card-body">
                  <p className="alpha-blog__meta">
                    <span>{formatPublishedDate(post.publishedAt)}</span>
                    <span>{post.readingTimeMinutes} min read</span>
                  </p>
                  <h2 className="alpha-blog__card-title">
                    <Link to={`/blog/${post.slug}`} className="alpha-blog__card-link">
                      {post.title}
                    </Link>
                  </h2>
                  <p className="alpha-blog__excerpt">{post.excerpt}</p>
                  <div className="alpha-blog__tags">
                    {post.tags.map((tag) => (
                      <span key={`${post.id}-${tag}`} className="alpha-blog__tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
