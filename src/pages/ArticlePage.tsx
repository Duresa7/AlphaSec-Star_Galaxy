import { useState, useEffect } from 'react';
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { NewsShell } from '@/components/news/NewsShell';
import { LikeButton } from '@/components/news/LikeButton';
import { CommentSection } from '@/components/news/CommentSection';
import { NewsAuthModal } from '@/components/news/NewsAuthModal';
import { useRole } from '@/hooks/useRole';
import { fetchArticleBySlug, fetchArticles, deleteArticle } from '@/data/articleStorage';
import type { Article } from '@/data/articleTypes';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function RelatedCard({ article }: { article: Article }) {
  const date = new Date(article.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <Link to={`/news/${article.slug}`} className="article-card">
      <div className="article-card__body">
        <div className="article-card__meta">
          <div className="article-card__avatar">{article.authorInitials}</div>
          <span className="article-card__author-name">{article.authorName}</span>
          <span className="article-card__date">&middot; {date}</span>
        </div>
        <h3 className="article-card__title">{article.title}</h3>
        <p className="article-card__excerpt">{article.excerpt}</p>
        <div className="article-card__footer">
          <span className="article-card__tag">{article.category}</span>
          <span className="article-card__read-time">{article.readingTimeMinutes} min read</span>
        </div>
      </div>
      <div className="article-card__thumb" aria-hidden="true">
        {article.coverImageUrl && <img src={article.coverImageUrl} alt="" />}
      </div>
    </Link>
  );
}

export function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isBossman } = useRole();
  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    fetchArticleBySlug(slug ?? '').then((data) => {
      if (cancelled) return;
      if (!data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setArticle(data);
      setLoading(false);

      fetchArticles({ limit: 4 }).then((all) => {
        if (cancelled) return;
        const others = all.filter(a => a.slug !== data.slug);
        const sameCat = others.filter(a => a.category === data.category);
        const backfill = others.filter(a => a.category !== data.category);
        setRelated([...sameCat, ...backfill].slice(0, 3));
      });
    });

    return () => { cancelled = true; };
  }, [slug]);

  const handleDelete = async () => {
    if (!article || deleting) return;
    if (!window.confirm('Delete this article? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await deleteArticle(article.id);
      navigate('/news', { replace: true });
    } catch {
      setDeleting(false);
    }
  };

  if (notFound) return <Navigate to="/news" replace />;

  if (loading) {
    return (
      <NewsShell>
        <div className="article-read">
          <div className="article-read__container">
            <p className="article-read__loading">Loading article...</p>
          </div>
        </div>
      </NewsShell>
    );
  }

  if (!article) return <Navigate to="/news" replace />;

  return (
    <NewsShell>
      <article className="article-read">
        <div className="article-read__cover" aria-hidden="true">
          {article.coverImageUrl && <img src={article.coverImageUrl} alt="" />}
        </div>

        <div className="article-read__container">
          <span className="article-read__category">{article.category}</span>
          <h1 className="article-read__title">{article.title}</h1>

          <div className="article-read__meta">
            <div className="article-read__avatar">{article.authorInitials}</div>
            <div className="article-read__author-info">
              <span className="article-read__author-name">{article.authorName}</span>
              <span className="article-read__date-row">
                {formatDate(article.createdAt)} &middot; {article.readingTimeMinutes} min read
              </span>
            </div>
          </div>

          {isBossman && (
            <div className="article-read__admin-bar">
              <Link to={`/news/editor/${article.id}`} className="news-btn news-btn--small">
                Edit
              </Link>
              <button
                className="news-btn news-btn--small news-btn--danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          )}

          <div
            className="article-read__body"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          <div className="article-read__reactions">
            <LikeButton
              articleId={article.id}
              initialCount={article.likesCount}
              initialLiked={article.userHasLiked}
              onAuthRequired={() => setAuthOpen(true)}
            />
          </div>

          <CommentSection
            articleId={article.id}
            onAuthRequired={() => setAuthOpen(true)}
          />
        </div>

        {related.length > 0 && (
          <section className="article-read__related">
            <h2 className="article-read__related-title">More from AlphaSec United</h2>
            <div className="article-read__related-grid">
              {related.map(a => (
                <RelatedCard key={a.slug} article={a} />
              ))}
            </div>
          </section>
        )}
      </article>

      <NewsAuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </NewsShell>
  );
}
