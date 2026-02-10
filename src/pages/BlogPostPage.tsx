import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchLatestPublishedPosts, fetchPublishedPostBySlug, formatCategoryLabel } from '@/data/blogPosts';
import { formatPublishedDate, renderMarkdownLite } from '@/lib/blogContent';
import type { BlogPost } from '@/types/blog';

export function BlogPostPage() {
  const heroImageUrl = `${import.meta.env.BASE_URL}homepage-bg.jpg`;
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!slug) {
        setIsLoading(false);
        return;
      }

      const [nextPost, nextRecent] = await Promise.all([
        fetchPublishedPostBySlug(slug),
        fetchLatestPublishedPosts(12),
      ]);

      if (!mounted) return;
      setPost(nextPost);
      setRecentPosts(nextRecent);
      setIsLoading(false);
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [slug]);

  const renderedBlocks = useMemo(() => {
    if (!post) return [];
    return renderMarkdownLite(post.content);
  }, [post]);

  const relatedPosts = useMemo(() => {
    if (!post) return recentPosts.filter((entry) => entry.slug !== slug).slice(0, 4);
    return recentPosts
      .filter((entry) => entry.slug !== post.slug)
      .sort((a, b) => {
        const aScore = Number(a.category === post.category) + a.tags.filter((tag) => post.tags.includes(tag)).length;
        const bScore = Number(b.category === post.category) + b.tags.filter((tag) => post.tags.includes(tag)).length;
        return bScore - aScore;
      })
      .slice(0, 4);
  }, [post, recentPosts, slug]);

  return (
    <main
      className="wp-clone-blog"
      aria-label="Blog article"
      style={{ '--portfolio-hero-bg-image': `url("${heroImageUrl}")` } as CSSProperties}
    >
      <div className="wp-clone-blog__texture" aria-hidden="true" />

      <div className="wp-clone-blog__shell wp-clone-blog__shell--article">
        <header className="wp-clone-blog__masthead">
          <div className="wp-clone-blog__brand-wrap">
            <p className="wp-clone-blog__eyebrow">WordPress-style publication</p>
            <h1 className="wp-clone-blog__title">Alpha Dispatch</h1>
          </div>

          <nav className="wp-clone-blog__nav" aria-label="Blog navigation">
            <Link to="/blog" className="wp-clone-blog__nav-link is-active">Blog</Link>
            <Link to="/resume" className="wp-clone-blog__nav-link">Resume</Link>
            <Link to="/" className="wp-clone-blog__nav-link">Frontpage</Link>
          </nav>
        </header>

        {isLoading ? (
          <section className="wp-clone-blog__empty-shell">
            <p className="wp-clone-blog__empty">Loading post...</p>
          </section>
        ) : !post ? (
          <section className="wp-clone-blog__empty-shell">
            <p className="wp-clone-blog__empty">This post was not found or is no longer published.</p>
            <Link to="/blog" className="wp-clone-blog__button">Back to Blog</Link>
          </section>
        ) : (
          <section className="wp-clone-blog__article-layout">
            <article className="wp-clone-article">
              <p className="wp-clone-article__breadcrumbs">
                <Link to="/">Home</Link>
                <span>/</span>
                <Link to="/blog">Blog</Link>
                <span>/</span>
                <span>{post.title}</span>
              </p>

              <p className="wp-clone-article__category">{formatCategoryLabel(post.category)}</p>
              <h2 className="wp-clone-article__title">{post.title}</h2>

              <p className="wp-clone-article__meta">
                <span>{formatPublishedDate(post.publishedAt, true)}</span>
                <span>{post.readingTimeMinutes} min read</span>
              </p>

              {post.coverImageUrl && (
                <img
                  className="wp-clone-article__cover"
                  src={post.coverImageUrl}
                  alt=""
                  loading="eager"
                />
              )}

              <div className="wp-clone-article__content">{renderedBlocks}</div>

              {post.tags.length > 0 && (
                <div className="wp-clone-article__tags">
                  {post.tags.map((tag) => (
                    <span key={`${post.id}-${tag}`}>#{tag}</span>
                  ))}
                </div>
              )}
            </article>

            <aside className="wp-clone-blog__sidebar" aria-label="Article sidebar">
              <section className="wp-clone-widget">
                <h2>Category</h2>
                <p>{formatCategoryLabel(post.category)}</p>
              </section>

              <section className="wp-clone-widget">
                <h2>Related Posts</h2>
                <ul>
                  {relatedPosts.length > 0 ? (
                    relatedPosts.map((entry) => (
                      <li key={entry.id}>
                        <Link to={`/blog/${entry.slug}`}>{entry.title}</Link>
                      </li>
                    ))
                  ) : (
                    <li>No related posts yet.</li>
                  )}
                </ul>
              </section>

              <section className="wp-clone-widget">
                <h2>Post Tags</h2>
                <div className="wp-clone-widget__tags">
                  {post.tags.length === 0 ? (
                    <span className="wp-clone-widget__muted">No tags</span>
                  ) : (
                    post.tags.map((tag) => (
                      <span key={`${post.id}-tag-${tag}`}>{tag}</span>
                    ))
                  )}
                </div>
              </section>

              <section className="wp-clone-widget">
                <h2>Comments</h2>
                <p>Comments are planned for a future phase of this WordPress-style clone.</p>
              </section>
            </aside>
          </section>
        )}
      </div>
    </main>
  );
}
