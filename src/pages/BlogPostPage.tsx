import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchPublishedPostBySlug } from '@/data/blogPosts';
import type { BlogPost } from '@/types/blog';

function formatPublishedDate(value: string | null): string {
  if (!value) return 'Unscheduled';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function renderMarkdownLite(content: string): ReactNode[] {
  const chunks = content
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  return chunks.map((chunk, index) => {
    if (chunk.startsWith('### ')) {
      return <h3 key={index}>{chunk.slice(4)}</h3>;
    }
    if (chunk.startsWith('## ')) {
      return <h2 key={index}>{chunk.slice(3)}</h2>;
    }
    if (chunk.startsWith('# ')) {
      return <h1 key={index}>{chunk.slice(2)}</h1>;
    }

    const listLines = chunk.split('\n').filter((line) => line.trim().startsWith('- '));
    if (listLines.length > 0 && listLines.length === chunk.split('\n').length) {
      return (
        <ul key={index}>
          {listLines.map((line) => (
            <li key={`${index}-${line}`}>{line.replace(/^\s*-\s+/, '')}</li>
          ))}
        </ul>
      );
    }

    return <p key={index}>{chunk}</p>;
  });
}

export function BlogPostPage() {
  const heroImageUrl = `${import.meta.env.BASE_URL}homepage-bg.jpg`;
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!slug) {
        setIsLoading(false);
        return;
      }
      const nextPost = await fetchPublishedPostBySlug(slug);
      if (!mounted) return;
      setPost(nextPost);
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

  return (
    <main
      className="alpha-blog"
      aria-label="Alpha Blog post"
      style={{ '--portfolio-hero-bg-image': `url("${heroImageUrl}")` } as CSSProperties}
    >
      <div className="alpha-blog__layer alpha-blog__layer--base" aria-hidden="true" />
      <div className="alpha-blog__layer alpha-blog__layer--grid" aria-hidden="true" />
      <div className="alpha-blog__layer alpha-blog__layer--veil" aria-hidden="true" />

      <div className="alpha-blog__shell alpha-blog__shell--reading">
        <header className="alpha-blog__masthead alpha-blog__masthead--compact">
          <div className="alpha-blog__masthead-actions">
            <Link to="/blog" className="alpha-blog__action alpha-blog__action--primary">
              Back to Alpha Blog
            </Link>
            <Link to="/" className="alpha-blog__action">
              Frontpage
            </Link>
          </div>
        </header>

        {isLoading ? (
          <section className="alpha-blog__article">
            <p className="alpha-blog__empty">Loading post...</p>
          </section>
        ) : !post ? (
          <section className="alpha-blog__article">
            <p className="alpha-blog__empty">This post was not found or is not published.</p>
          </section>
        ) : (
          <article className="alpha-blog__article">
            <p className="alpha-blog__eyebrow">Alpha Blog</p>
            <h1 className="alpha-blog__article-title">{post.title}</h1>
            <p className="alpha-blog__meta alpha-blog__meta--article">
              <span>{formatPublishedDate(post.publishedAt)}</span>
              <span>{post.readingTimeMinutes} min read</span>
            </p>
            {post.coverImageUrl && (
              <img className="alpha-blog__article-cover" src={post.coverImageUrl} alt="" loading="eager" />
            )}
            <div className="alpha-blog__article-content">{renderedBlocks}</div>
            <div className="alpha-blog__tags">
              {post.tags.map((tag) => (
                <span key={`${post.id}-${tag}`} className="alpha-blog__tag">
                  {tag}
                </span>
              ))}
            </div>
          </article>
        )}
      </div>
    </main>
  );
}
