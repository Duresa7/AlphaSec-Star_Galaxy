import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { fetchLatestPublishedPosts, formatCategoryLabel, normalizeCategorySlug } from '@/data/blogPosts';
import { formatPublishedDate } from '@/lib/blogContent';
import type { BlogPost } from '@/types/blog';
import { useAuthStore } from '@/store/authStore';

const POSTS_PER_PAGE = 6;

function getCategoryCount(posts: BlogPost[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const post of posts) {
    const key = normalizeCategorySlug(post.category) || 'general';
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

export function BlogPage() {
  const heroImageUrl = `${import.meta.env.BASE_URL}homepage-bg.jpg`;
  const { isAdmin } = useAuthStore();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeTag, setActiveTag] = useState('all');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const nextPosts = await fetchLatestPublishedPosts(150);
      if (!mounted) return;
      setPosts(nextPosts);
      setIsLoading(false);
    };

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const featuredPost = posts[0] || null;
  const feedSource = useMemo(() => (featuredPost ? posts.slice(1) : posts), [featuredPost, posts]);

  const categoryCount = useMemo(() => getCategoryCount(posts), [posts]);

  const categoryOptions = useMemo(() => {
    const values = Array.from(categoryCount.keys()).sort();
    return ['all', ...values];
  }, [categoryCount]);

  const tagOptions = useMemo(() => {
    const tags = new Set<string>();
    for (const post of posts) {
      for (const tag of post.tags) tags.add(tag);
    }
    return ['all', ...Array.from(tags).sort()];
  }, [posts]);

  useEffect(() => {
    setPage(1);
  }, [query, activeCategory, activeTag]);

  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return feedSource.filter((post) => {
      const normalizedCategory = normalizeCategorySlug(post.category) || 'general';
      if (activeCategory !== 'all' && normalizedCategory !== activeCategory) return false;
      if (activeTag !== 'all' && !post.tags.includes(activeTag)) return false;
      if (!normalizedQuery) return true;

      return (
        post.title.toLowerCase().includes(normalizedQuery)
        || post.excerpt.toLowerCase().includes(normalizedQuery)
        || post.content.toLowerCase().includes(normalizedQuery)
        || post.tags.some((tag) => tag.includes(normalizedQuery))
        || normalizedCategory.includes(normalizedQuery)
      );
    });
  }, [activeCategory, activeTag, feedSource, query]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pagedPosts = useMemo(() => {
    const start = (currentPage - 1) * POSTS_PER_PAGE;
    return filteredPosts.slice(start, start + POSTS_PER_PAGE);
  }, [currentPage, filteredPosts]);

  const recentPosts = posts.slice(0, 5);

  return (
    <main
      className="wp-clone-blog"
      aria-label="Alpha Blog"
      style={{ '--portfolio-hero-bg-image': `url("${heroImageUrl}")` } as CSSProperties}
    >
      <div className="wp-clone-blog__texture" aria-hidden="true" />

      <div className="wp-clone-blog__shell">
        <header className="wp-clone-blog__masthead">
          <div className="wp-clone-blog__brand-wrap">
            <p className="wp-clone-blog__eyebrow">WordPress-style publication</p>
            <h1 className="wp-clone-blog__title">Alpha Dispatch</h1>
          </div>

          <nav className="wp-clone-blog__nav" aria-label="Blog navigation">
            <Link to="/blog" className="wp-clone-blog__nav-link is-active">Blog</Link>
            <Link to="/resume" className="wp-clone-blog__nav-link">Resume</Link>
            <Link to="/" className="wp-clone-blog__nav-link">Frontpage</Link>
            {isAdmin && <Link to="/blog/manage" className="wp-clone-blog__nav-link is-cta">Dashboard</Link>}
          </nav>
        </header>

        {featuredPost && (
          <section className="wp-clone-blog__hero" aria-label="Featured post">
            <div className="wp-clone-blog__hero-copy">
              <p className="wp-clone-blog__hero-tag">Featured Article</p>
              <h2>{featuredPost.title}</h2>
              <p className="wp-clone-blog__hero-meta">
                <span>{formatPublishedDate(featuredPost.publishedAt, true)}</span>
                <span>{featuredPost.readingTimeMinutes} min read</span>
                <span>{formatCategoryLabel(featuredPost.category)}</span>
              </p>
              <p>{featuredPost.excerpt}</p>
              <Link to={`/blog/${featuredPost.slug}`} className="wp-clone-blog__button">
                Continue Reading
              </Link>
            </div>
            {featuredPost.coverImageUrl ? (
              <img src={featuredPost.coverImageUrl} alt="" className="wp-clone-blog__hero-image" loading="lazy" />
            ) : (
              <div className="wp-clone-blog__hero-image wp-clone-blog__hero-image--empty" aria-hidden="true" />
            )}
          </section>
        )}

        <section className="wp-clone-blog__content">
          <div className="wp-clone-blog__feed">
            <div className="wp-clone-blog__toolbar">
              <label htmlFor="wp-clone-query">
                <span>Search posts</span>
                <input
                  id="wp-clone-query"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                  }}
                  placeholder="Search by title, excerpt, content, or taxonomy"
                />
              </label>

              <label htmlFor="wp-clone-category">
                <span>Category</span>
                <select
                  id="wp-clone-category"
                  value={activeCategory}
                  onChange={(event) => {
                    setActiveCategory(event.target.value);
                  }}
                >
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All categories' : formatCategoryLabel(category)}
                    </option>
                  ))}
                </select>
              </label>

              <label htmlFor="wp-clone-tag">
                <span>Tag</span>
                <select
                  id="wp-clone-tag"
                  value={activeTag}
                  onChange={(event) => {
                    setActiveTag(event.target.value);
                  }}
                >
                  {tagOptions.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag === 'all' ? 'All tags' : tag}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {isLoading ? (
              <p className="wp-clone-blog__empty">Loading latest posts...</p>
            ) : pagedPosts.length === 0 ? (
              <p className="wp-clone-blog__empty">No posts matched your filters.</p>
            ) : (
              <div className="wp-clone-blog__posts" aria-live="polite">
                {pagedPosts.map((post) => (
                  <article key={post.id} className="wp-clone-post-card">
                    <p className="wp-clone-post-card__meta">
                      <span>{formatPublishedDate(post.publishedAt)}</span>
                      <span>{post.readingTimeMinutes} min</span>
                      <span>{formatCategoryLabel(post.category)}</span>
                    </p>
                    <h3>
                      <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                    </h3>
                    <p>{post.excerpt}</p>
                    {post.tags.length > 0 && (
                      <div className="wp-clone-post-card__tags">
                        {post.tags.slice(0, 5).map((tag) => (
                          <button
                            key={`${post.id}-${tag}`}
                            type="button"
                            onClick={() => {
                              setActiveTag(tag);
                            }}
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    )}
                    <Link to={`/blog/${post.slug}`} className="wp-clone-post-card__more">Read More</Link>
                  </article>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <nav className="wp-clone-blog__pagination" aria-label="Posts pages">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => {
                    setPage((current) => Math.max(1, current - 1));
                  }}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    className={pageNumber === currentPage ? 'is-active' : ''}
                    onClick={() => {
                      setPage(pageNumber);
                    }}
                  >
                    {pageNumber}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => {
                    setPage((current) => Math.min(totalPages, current + 1));
                  }}
                >
                  Next
                </button>
              </nav>
            )}
          </div>

          <aside className="wp-clone-blog__sidebar" aria-label="Blog sidebar">
            <section className="wp-clone-widget">
              <h2>About This Blog</h2>
              <p>
                A WordPress-inspired editorial layout for Alpha Sec mission reports, build logs, and release notes.
              </p>
            </section>

            <section className="wp-clone-widget">
              <h2>Categories</h2>
              <ul>
                <li>
                  <button
                    type="button"
                    className={activeCategory === 'all' ? 'is-active' : ''}
                    onClick={() => {
                      setActiveCategory('all');
                    }}
                  >
                    All Categories ({posts.length})
                  </button>
                </li>
                {categoryOptions
                  .filter((category) => category !== 'all')
                  .map((category) => (
                    <li key={category}>
                      <button
                        type="button"
                        className={activeCategory === category ? 'is-active' : ''}
                        onClick={() => {
                          setActiveCategory(category);
                        }}
                      >
                        {formatCategoryLabel(category)} ({categoryCount.get(category) || 0})
                      </button>
                    </li>
                  ))}
              </ul>
            </section>

            <section className="wp-clone-widget">
              <h2>Recent Posts</h2>
              <ul>
                {recentPosts.map((post) => (
                  <li key={post.id}>
                    <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                  </li>
                ))}
              </ul>
            </section>

            {tagOptions.length > 1 && (
              <section className="wp-clone-widget">
                <h2>Tag Cloud</h2>
                <div className="wp-clone-widget__tags">
                  {tagOptions
                    .filter((tag) => tag !== 'all')
                    .map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className={activeTag === tag ? 'is-active' : ''}
                        onClick={() => {
                          setActiveTag(tag);
                        }}
                      >
                        {tag}
                      </button>
                    ))}
                </div>
              </section>
            )}
          </aside>
        </section>
      </div>
    </main>
  );
}
