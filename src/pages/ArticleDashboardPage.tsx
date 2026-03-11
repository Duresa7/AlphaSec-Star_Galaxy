import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { NewsShell } from '@/components/news/NewsShell';
import { fetchArticles, updateArticle, deleteArticle } from '@/data/articleStorage';
import {
  fetchTimelineEntries,
  createTimelineEntry,
  updateTimelineEntry,
  deleteTimelineEntry,
} from '@/data/timelineStorage';
import { fetchFeedback, deleteFeedback } from '@/data/feedbackStorage';
import type { Article } from '@/data/articleTypes';
import type { TimelineEntry, TimelineEntryType } from '@/data/timelineStorage';
import type { FeedbackEntry } from '@/data/feedbackStorage';
import { formatDate } from '@/utils/format';

const EMPTY_ENTRY_FORM = {
  title: '',
  type: 'update' as TimelineEntryType,
  description: '',
  expandedContent: '',
  timestamp: '',
};

type EntryForm = typeof EMPTY_ENTRY_FORM;

export function ArticleDashboardPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [entryFormOpen, setEntryFormOpen] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [entryForm, setEntryForm] = useState<EntryForm>(EMPTY_ENTRY_FORM);
  const [savingEntry, setSavingEntry] = useState(false);

  const loadAll = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetchArticles({ includeDrafts: true }),
      fetchTimelineEntries(),
      fetchFeedback(),
    ]).then(([articleData, entryData, feedbackData]) => {
      setArticles(articleData);
      setEntries(entryData);
      setFeedback(feedbackData);
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

  const handleDeleteArticle = useCallback(async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setArticles((prev) => prev.filter((a) => a.id !== id));
    try {
      await deleteArticle(id);
    } catch {
      loadAll();
    }
  }, [loadAll]);

  const openAddEntry = () => {
    setEditingEntryId(null);
    setEntryForm(EMPTY_ENTRY_FORM);
    setEntryFormOpen(true);
  };

  const openEditEntry = (e: TimelineEntry) => {
    setEditingEntryId(e.id);
    setEntryForm({
      title: e.title,
      type: e.type,
      description: e.description,
      expandedContent: e.expandedContent,
      timestamp: e.timestamp ? e.timestamp.slice(0, 16) : '',
    });
    setEntryFormOpen(true);
  };

  const cancelEntryForm = () => {
    setEntryFormOpen(false);
    setEditingEntryId(null);
    setEntryForm(EMPTY_ENTRY_FORM);
  };

  const handleEntrySave = async () => {
    if (!entryForm.title.trim() || savingEntry) return;
    setSavingEntry(true);

    const input = {
      title: entryForm.title.trim(),
      type: entryForm.type,
      description: entryForm.description.trim(),
      expandedContent: entryForm.expandedContent.trim(),
      timestamp: entryForm.timestamp || undefined,
    };

    try {
      if (editingEntryId) {
        await updateTimelineEntry(editingEntryId, input);
        loadAll();
      } else {
        const created = await createTimelineEntry(input);
        setEntries((prev) => [created, ...prev]);
      }
      cancelEntryForm();
    } catch {
      // form stays open on failure
    } finally {
      setSavingEntry(false);
    }
  };

  const handleDeleteEntry = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setEntries((prev) => prev.filter((e) => e.id !== id));
    try {
      await deleteTimelineEntry(id);
    } catch {
      loadAll();
    }
  };

  const handleDeleteFeedback = useCallback(async (id: string) => {
    if (!window.confirm('Delete this feedback? This cannot be undone.')) return;
    setFeedback((prev) => prev.filter((f) => f.id !== id));
    try {
      await deleteFeedback(id);
    } catch {
      loadAll();
    }
  }, [loadAll]);

  const setField = (field: keyof EntryForm, value: string) =>
    setEntryForm((prev) => ({ ...prev, [field]: value }));

  return (
    <NewsShell>
      <div className="article-dash">

        {/* ── Articles ── */}
        <header className="article-dash__header">
          <div>
            <h1 className="article-dash__title">Article Dashboard</h1>
            <p className="article-dash__subtitle">{articles.length} article{articles.length !== 1 ? 's' : ''}</p>
          </div>
          <Link to="/news/editor" className="news-btn news-btn--primary">
            New Post
          </Link>
        </header>

        {loading && <p className="article-dash__empty">Loading...</p>}

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
                        onClick={() => handleDeleteArticle(a.id, a.title)}
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

        {/* ── Latest Updates (Timeline) ── */}
        <div className="article-dash__section">
          <div className="article-dash__section-header">
            <h2 className="article-dash__section-title">Latest Updates</h2>
            {!entryFormOpen && (
              <button className="news-btn news-btn--primary" onClick={openAddEntry}>
                Add Entry
              </button>
            )}
          </div>

          {entryFormOpen && (
            <div className="article-dash__status-form">
              <div className="article-dash__status-form-grid">
                <div className="article-editor__field">
                  <label className="article-editor__label">Title *</label>
                  <input
                    type="text"
                    className="article-editor__input"
                    value={entryForm.title}
                    onChange={(e) => setField('title', e.target.value)}
                    placeholder="e.g. v2.1.0 Released"
                    maxLength={200}
                  />
                </div>
                <div className="article-editor__field">
                  <label className="article-editor__label">Type</label>
                  <select
                    className="article-editor__select"
                    value={entryForm.type}
                    onChange={(e) => setField('type', e.target.value)}
                  >
                    <option value="update">Update</option>
                    <option value="release">Release</option>
                    <option value="incident">Incident</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div className="article-editor__field">
                  <label className="article-editor__label">Timestamp</label>
                  <input
                    type="datetime-local"
                    className="article-editor__input"
                    value={entryForm.timestamp}
                    onChange={(e) => setField('timestamp', e.target.value)}
                  />
                </div>
              </div>
              <div className="article-editor__field">
                <label className="article-editor__label">Description</label>
                <input
                  type="text"
                  className="article-editor__input"
                  value={entryForm.description}
                  onChange={(e) => setField('description', e.target.value)}
                  placeholder="Short summary shown in the list"
                  maxLength={300}
                />
              </div>
              <div className="article-editor__field">
                <label className="article-editor__label">Expanded Content (Markdown)</label>
                <textarea
                  className="article-editor__textarea"
                  value={entryForm.expandedContent}
                  onChange={(e) => setField('expandedContent', e.target.value)}
                  placeholder={"Full details shown when the entry is expanded.\n\nUse markdown for paragraphs, lists, links, and headings.\n- Bullet item\n- Another item"}
                  rows={6}
                  maxLength={2000}
                />
                <p className="article-dash__entry-help">
                  Supports markdown, including paragraphs, bullet lists, links, and headings.
                </p>
              </div>
              <div className="article-dash__status-form-actions">
                <button
                  className="news-btn news-btn--primary"
                  onClick={handleEntrySave}
                  disabled={savingEntry || !entryForm.title.trim()}
                >
                  {savingEntry ? 'Saving...' : editingEntryId ? 'Update' : 'Add'}
                </button>
                <button className="news-btn news-btn--ghost" onClick={cancelEntryForm}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!loading && entries.length === 0 && !entryFormOpen && (
            <p className="article-dash__empty">No updates yet. Add one to get started.</p>
          )}

          {entries.length > 0 && (
            <div className="article-dash__entry-list">
              {entries.map((e) => (
                <div key={e.id} className="article-dash__entry-row">
                  <div className="article-dash__entry-row-info">
                    <div className="article-dash__entry-row-meta">
                      <span className={`timeline-tone timeline-tone--${e.type}`}>{e.type}</span>
                      <span className="article-dash__entry-row-date">{formatDate(e.timestamp)}</span>
                      {e.expandedContent.trim() && (
                        <span className="article-dash__entry-row-pill">Expandable details</span>
                      )}
                    </div>
                    <span className="article-dash__entry-row-name">{e.title}</span>
                    {e.description.trim() && (
                      <p className="article-dash__entry-row-summary">{e.description}</p>
                    )}
                    {e.expandedContent.trim() && (
                      <p className="article-dash__entry-row-detail">{e.expandedContent}</p>
                    )}
                  </div>
                  <div className="article-dash__td--actions article-dash__entry-row-actions">
                    <button
                      className="news-btn news-btn--small"
                      onClick={() => openEditEntry(e)}
                    >
                      Edit
                    </button>
                    <button
                      className="news-btn news-btn--small news-btn--danger"
                      onClick={() => handleDeleteEntry(e.id, e.title)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Feedback ── */}
        <div className="article-dash__section">
          <div className="article-dash__section-header">
            <h2 className="article-dash__section-title">Feedback</h2>
            <span className="article-dash__subtitle">{feedback.length} submission{feedback.length !== 1 ? 's' : ''}</span>
          </div>

          {!loading && feedback.length === 0 && (
            <p className="article-dash__empty">No feedback submissions yet.</p>
          )}

          {feedback.length > 0 && (
            <div className="article-dash__table-wrap">
              <table className="article-dash__table">
                <thead>
                  <tr>
                    <th className="article-dash__th">User</th>
                    <th className="article-dash__th">Category</th>
                    <th className="article-dash__th">Message</th>
                    <th className="article-dash__th">Date</th>
                    <th className="article-dash__th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {feedback.map((f) => (
                    <tr key={f.id} className="article-dash__row">
                      <td className="article-dash__td">{f.display_name}</td>
                      <td className="article-dash__td">
                        <span className="article-dash__cat">
                          {f.category === 'feature_request'
                            ? 'Feature Request'
                            : f.category === 'bug'
                            ? 'Bug'
                            : f.other_label ?? 'Other'}
                        </span>
                      </td>
                      <td className="article-dash__td article-dash__td--title">{f.message}</td>
                      <td className="article-dash__td article-dash__td--date">{formatDate(f.created_at)}</td>
                      <td className="article-dash__td article-dash__td--actions">
                        <button
                          className="news-btn news-btn--small news-btn--danger"
                          onClick={() => handleDeleteFeedback(f.id)}
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

      </div>
    </NewsShell>
  );
}
