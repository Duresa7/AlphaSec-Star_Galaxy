import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { NewsShell } from '@/components/news/NewsShell';
import { fetchArticles, updateArticle, deleteArticle } from '@/data/articleStorage';
import type { Article } from '@/data/articleTypes';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function ArticleDashboardPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(() => {
    setLoading(true);
    fetchArticles({ includeDrafts: true }).then((data) => {
      setArticles(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleToggle = useCallback(async (id: string, field: 'published' | 'isFeatured' | 'isTrending', current: boolean) => {
    setArticles((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: !current } : a)),
    );

    try {
      await updateArticle(id, { [field]: !current });
    } catch {
      setArticles((prev) =>
        prev.map((a) => (a.id === id ? { ...a, [field]: current } : a)),
      );
    }
  }, []);

  const handleDelete = useCallback(async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;

    setArticles((prev) => prev.filter((a) => a.id !== id));
    try {
      await deleteArticle(id);
    } catch {
      loadAll();
    }
  }, [loadAll]);

  return (
    <NewsShell>
      <div className="article-dash">
        <header className="article-dash__header">
          <div>
            <h1 className="article-dash__title">Article Dashboard</h1>
            <p className="article-dash__subtitle">{articles.length} article{articles.length !== 1 ? 's' : ''}</p>
          </div>
          <Link to="/news/editor" className="news-btn news-btn--primary">
            New Post
          </Link>
        </header>

        {loading && <p className="article-dash__empty">Loading articles...</p>}

        {!loading && articles.length === 0 && (
          <div className="article-dash__empty">
            <p>No articles yet. Create your first post to get started.</p>
          </div>
        )}

        {!loading && articles.length > 0 && (
          <div className="article-dash__table-wrap">
            <table className="article-dash__table">
              <thead>
                <tr>
                  <th className="article-dash__th">Title</th>
                  <th className="article-dash__th">Category</th>
                  <th className="article-dash__th">Status</th>
                  <th className="article-dash__th article-dash__th--center">Featured</th>
                  <th className="article-dash__th article-dash__th--center">Trending</th>
                  <th className="article-dash__th">Date</th>
                  <th className="article-dash__th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((a) => (
                  <tr key={a.id} className="article-dash__row">
                    <td className="article-dash__td article-dash__td--title">
                      <Link to={`/news/${a.slug}`} className="article-dash__link">
                        {a.title}
                      </Link>
                    </td>
                    <td className="article-dash__td">
                      <span className="article-dash__cat">{a.category}</span>
                    </td>
                    <td className="article-dash__td">
                      <button
                        className={`article-dash__pill ${a.published ? 'article-dash__pill--published' : 'article-dash__pill--draft'}`}
                        onClick={() => handleToggle(a.id, 'published', a.published)}
                      >
                        {a.published ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td className="article-dash__td article-dash__td--center">
                      <input
                        type="checkbox"
                        checked={a.isFeatured}
                        onChange={() => handleToggle(a.id, 'isFeatured', a.isFeatured)}
                        className="article-dash__check"
                      />
                    </td>
                    <td className="article-dash__td article-dash__td--center">
                      <input
                        type="checkbox"
                        checked={a.isTrending}
                        onChange={() => handleToggle(a.id, 'isTrending', a.isTrending)}
                        className="article-dash__check"
                      />
                    </td>
                    <td className="article-dash__td article-dash__td--date">
                      {formatDate(a.createdAt)}
                    </td>
                    <td className="article-dash__td article-dash__td--actions">
                      <Link to={`/news/editor/${a.id}`} className="news-btn news-btn--small">
                        Edit
                      </Link>
                      <button
                        className="news-btn news-btn--small news-btn--danger"
                        onClick={() => handleDelete(a.id, a.title)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </NewsShell>
  );
}
