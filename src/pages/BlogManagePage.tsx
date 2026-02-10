import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  createBlogPost,
  deleteBlogPost,
  fetchAdminBlogPosts,
  formatCategoryLabel,
  normalizeBlogSlug,
  normalizeCategorySlug,
  updateBlogPost,
} from '@/data/blogPosts';
import { formatPublishedDate, renderMarkdownLite } from '@/lib/blogContent';
import type { BlogPost, BlogPostMutationInput, BlogPostStatus } from '@/types/blog';
import { useAuthStore } from '@/store/authStore';

type BlogEditorState = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  coverImageUrl: string;
  tagsText: string;
  status: BlogPostStatus;
  publishedAtLocal: string;
};

const EMPTY_EDITOR: BlogEditorState = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  category: 'general',
  coverImageUrl: '',
  tagsText: '',
  status: 'draft',
  publishedAtLocal: '',
};

function toLocalInputValue(isoValue: string | null): string {
  if (!isoValue) return '';
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) return '';
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function toIsoValue(localValue: string): string | null {
  if (!localValue) return null;
  const date = new Date(localValue);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function toMutationInput(state: BlogEditorState): BlogPostMutationInput {
  return {
    slug: state.slug,
    title: state.title,
    excerpt: state.excerpt,
    content: state.content,
    category: normalizeCategorySlug(state.category) || 'general',
    coverImageUrl: state.coverImageUrl || null,
    tags: state.tagsText
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    status: state.status,
    publishedAt: state.status === 'published' ? toIsoValue(state.publishedAtLocal) : null,
  };
}

function formatDate(value: string | null): string {
  if (!value) return 'Draft';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function BlogManagePage() {
  const heroImageUrl = `${import.meta.env.BASE_URL}homepage-bg.jpg`;
  const { user, isAdmin } = useAuthStore();

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [editor, setEditor] = useState<BlogEditorState>(EMPTY_EDITOR);

  const bodyInputRef = useRef<HTMLTextAreaElement | null>(null);

  const selectedPost = useMemo(
    () => posts.find((post) => post.id === selectedPostId) || null,
    [posts, selectedPostId],
  );

  const renderedPreview = useMemo(() => renderMarkdownLite(editor.content || 'Start writing to preview your post...'), [editor.content]);

  const loadPosts = async () => {
    const nextPosts = await fetchAdminBlogPosts();
    setPosts(nextPosts);
    setIsLoading(false);
  };

  useEffect(() => {
    if (!isAdmin) return;
    void loadPosts();
  }, [isAdmin]);

  if (!user) return <Navigate to="/" replace />;
  if (!isAdmin) return <Navigate to="/blog" replace />;

  const resetEditor = () => {
    setSelectedPostId(null);
    setSlugTouched(false);
    setEditor(EMPTY_EDITOR);
    setError(null);
  };

  const startEditing = (post: BlogPost) => {
    setSelectedPostId(post.id);
    setSlugTouched(true);
    setError(null);
    setEditor({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
      coverImageUrl: post.coverImageUrl || '',
      tagsText: post.tags.join(', '),
      status: post.status,
      publishedAtLocal: toLocalInputValue(post.publishedAt),
    });
  };

  const insertAroundSelection = (prefix: string, suffix = prefix, placeholder = 'text') => {
    const element = bodyInputRef.current;

    if (!element) {
      setEditor((current) => ({ ...current, content: `${current.content}${prefix}${placeholder}${suffix}` }));
      return;
    }

    const start = element.selectionStart;
    const end = element.selectionEnd;
    const selectedText = editor.content.slice(start, end);
    const replacement = `${prefix}${selectedText || placeholder}${suffix}`;
    const next = `${editor.content.slice(0, start)}${replacement}${editor.content.slice(end)}`;

    setEditor((current) => ({ ...current, content: next }));

    requestAnimationFrame(() => {
      const cursor = start + replacement.length;
      element.focus();
      element.setSelectionRange(cursor, cursor);
    });
  };

  const prefixSelectionLines = (prefix: string, placeholder = 'List item') => {
    const element = bodyInputRef.current;

    if (!element) {
      setEditor((current) => ({ ...current, content: `${current.content}\n${prefix}${placeholder}`.trim() }));
      return;
    }

    const start = element.selectionStart;
    const end = element.selectionEnd;

    const lineStart = editor.content.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
    const lineEndIndex = editor.content.indexOf('\n', end);
    const lineEnd = lineEndIndex === -1 ? editor.content.length : lineEndIndex;
    const selectedBlock = editor.content.slice(lineStart, lineEnd) || placeholder;

    const transformed = selectedBlock
      .split('\n')
      .map((line) => `${prefix}${line.trim() || placeholder}`)
      .join('\n');

    const next = `${editor.content.slice(0, lineStart)}${transformed}${editor.content.slice(lineEnd)}`;
    setEditor((current) => ({ ...current, content: next }));

    requestAnimationFrame(() => {
      const cursor = lineStart + transformed.length;
      element.focus();
      element.setSelectionRange(cursor, cursor);
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      const payload = toMutationInput(editor);
      if (selectedPostId) {
        await updateBlogPost(selectedPostId, payload);
      } else {
        await createBlogPost(payload);
      }

      await loadPosts();
      if (!selectedPostId) resetEditor();
    } catch (err) {
      console.error(err);
      setError('Could not save post. Check slug uniqueness and required fields.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (post: BlogPost) => {
    const confirmed = window.confirm(`Delete "${post.title}"? This cannot be undone.`);
    if (!confirmed) return;

    setError(null);
    setIsSaving(true);

    try {
      await deleteBlogPost(post.id);
      if (selectedPostId === post.id) {
        resetEditor();
      }
      await loadPosts();
    } catch (err) {
      console.error(err);
      setError('Could not delete post.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main
      className="wp-admin-clone"
      aria-label="WordPress style admin"
      style={{ '--portfolio-hero-bg-image': `url("${heroImageUrl}")` } as CSSProperties}
    >
      <div className="wp-admin-clone__texture" aria-hidden="true" />

      <header className="wp-admin-clone__topbar">
        <p>Alpha Dispatch Admin</p>
        <nav aria-label="Admin navigation">
          <Link to="/blog">View Site</Link>
          <Link to="/">Frontpage</Link>
        </nav>
      </header>

      <div className="wp-admin-clone__layout">
        <aside className="wp-admin-clone__menu" aria-label="Admin menu">
          <h1>Dashboard</h1>
          <ul>
            <li className="is-active">Posts</li>
            <li>Media (planned)</li>
            <li>Comments (planned)</li>
            <li>Appearance (planned)</li>
          </ul>
          <button type="button" onClick={resetEditor}>Create New Post</button>
        </aside>

        <section className="wp-admin-clone__workspace">
          <section className="wp-admin-panel wp-admin-panel--editor">
            <header className="wp-admin-panel__header">
              <div>
                <p className="wp-admin-panel__eyebrow">Post Editor</p>
                <h2>{selectedPost ? `Editing: ${selectedPost.title}` : 'Create New Post'}</h2>
              </div>
              {selectedPost && (
                <button type="button" onClick={resetEditor}>New Draft</button>
              )}
            </header>

            <form className="wp-admin-form" onSubmit={handleSubmit}>
              <label>
                <span>Title</span>
                <input
                  value={editor.title}
                  onChange={(event) => {
                    const value = event.target.value;
                    setEditor((current) => ({
                      ...current,
                      title: value,
                      slug: slugTouched ? current.slug : normalizeBlogSlug(value),
                    }));
                  }}
                  required
                />
              </label>

              <div className="wp-admin-form__grid">
                <label>
                  <span>Slug</span>
                  <input
                    value={editor.slug}
                    onChange={(event) => {
                      setSlugTouched(true);
                      setEditor((current) => ({ ...current, slug: normalizeBlogSlug(event.target.value) }));
                    }}
                    placeholder="my-post-slug"
                    required
                  />
                </label>

                <label>
                  <span>Category</span>
                  <input
                    value={editor.category}
                    onChange={(event) => {
                      setEditor((current) => ({
                        ...current,
                        category: normalizeCategorySlug(event.target.value) || 'general',
                      }));
                    }}
                    placeholder="general"
                    required
                  />
                </label>
              </div>

              <label>
                <span>Excerpt</span>
                <textarea
                  rows={3}
                  value={editor.excerpt}
                  onChange={(event) => {
                    setEditor((current) => ({ ...current, excerpt: event.target.value }));
                  }}
                  required
                />
              </label>

              <div className="wp-admin-form__grid">
                <label>
                  <span>Cover Image URL</span>
                  <input
                    type="url"
                    value={editor.coverImageUrl}
                    onChange={(event) => {
                      setEditor((current) => ({ ...current, coverImageUrl: event.target.value }));
                    }}
                    placeholder="https://..."
                  />
                </label>

                <label>
                  <span>Tags (comma-separated)</span>
                  <input
                    value={editor.tagsText}
                    onChange={(event) => {
                      setEditor((current) => ({ ...current, tagsText: event.target.value }));
                    }}
                    placeholder="react, release, ops"
                  />
                </label>
              </div>

              <label>
                <span>Body</span>
                <div className="wp-admin-editor">
                  <div className="wp-admin-editor__toolbar" role="toolbar" aria-label="Formatting toolbar">
                    <button type="button" onClick={() => insertAroundSelection('**')}><strong>B</strong></button>
                    <button type="button" onClick={() => insertAroundSelection('*')}><em>I</em></button>
                    <button type="button" onClick={() => insertAroundSelection('`')}>Code</button>
                    <button type="button" onClick={() => prefixSelectionLines('# ', 'Heading')}>H1</button>
                    <button type="button" onClick={() => prefixSelectionLines('## ', 'Heading')}>H2</button>
                    <button type="button" onClick={() => prefixSelectionLines('- ', 'List item')}>List</button>
                    <button type="button" onClick={() => prefixSelectionLines('> ', 'Quoted text')}>Quote</button>
                    <button
                      type="button"
                      onClick={() => insertAroundSelection('[', '](https://example.com)', 'Link text')}
                    >
                      Link
                    </button>
                  </div>

                  <textarea
                    ref={bodyInputRef}
                    rows={14}
                    value={editor.content}
                    onChange={(event) => {
                      setEditor((current) => ({ ...current, content: event.target.value }));
                    }}
                    required
                  />
                </div>
              </label>

              <div className="wp-admin-form__grid">
                <label>
                  <span>Status</span>
                  <select
                    value={editor.status}
                    onChange={(event) => {
                      const nextStatus = event.target.value as BlogPostStatus;
                      setEditor((current) => ({
                        ...current,
                        status: nextStatus,
                        publishedAtLocal:
                          nextStatus === 'published'
                            ? (current.publishedAtLocal || toLocalInputValue(new Date().toISOString()))
                            : '',
                      }));
                    }}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </label>

                <label>
                  <span>Publish At</span>
                  <input
                    type="datetime-local"
                    value={editor.publishedAtLocal}
                    disabled={editor.status !== 'published'}
                    onChange={(event) => {
                      setEditor((current) => ({ ...current, publishedAtLocal: event.target.value }));
                    }}
                  />
                </label>
              </div>

              {error && <p className="wp-admin-form__error">{error}</p>}

              <button type="submit" className="wp-admin-form__submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : selectedPost ? 'Update Post' : 'Publish Post'}
              </button>
            </form>

            <section className="wp-admin-preview" aria-label="Live preview">
              <header>
                <p>Preview</p>
                <span>
                  {editor.status === 'published'
                    ? `Publishes ${editor.publishedAtLocal ? formatDate(toIsoValue(editor.publishedAtLocal)) : 'immediately'}`
                    : 'Draft mode'}
                </span>
              </header>
              <article>
                <p className="wp-admin-preview__meta">
                  <span>{formatCategoryLabel(editor.category)}</span>
                  <span>{formatPublishedDate(toIsoValue(editor.publishedAtLocal), true)}</span>
                </p>
                <h3>{editor.title || 'Post title preview'}</h3>
                <p className="wp-admin-preview__excerpt">{editor.excerpt || 'Your excerpt appears here.'}</p>
                <div className="wp-admin-preview__content">{renderedPreview}</div>
              </article>
            </section>
          </section>

          <section className="wp-admin-panel">
            <header className="wp-admin-panel__header">
              <div>
                <p className="wp-admin-panel__eyebrow">All Posts</p>
                <h2>Content Library</h2>
              </div>
              <span>{posts.length} total</span>
            </header>

            {isLoading ? (
              <p className="wp-admin-panel__empty">Loading posts...</p>
            ) : posts.length === 0 ? (
              <p className="wp-admin-panel__empty">No posts yet.</p>
            ) : (
              <div className="wp-admin-post-list" aria-live="polite">
                {posts.map((post) => (
                  <article key={post.id} className="wp-admin-post-item">
                    <header>
                      <h3>{post.title}</h3>
                      <span className={`is-${post.status}`}>{post.status}</span>
                    </header>

                    <p className="wp-admin-post-item__meta">
                      <span>{formatCategoryLabel(post.category)}</span>
                      <span>{formatDate(post.publishedAt)}</span>
                      <span>{post.readingTimeMinutes} min</span>
                    </p>

                    <p className="wp-admin-post-item__slug">/{post.slug}</p>
                    <p className="wp-admin-post-item__excerpt">{post.excerpt}</p>

                    <div className="wp-admin-post-item__actions">
                      <button type="button" onClick={() => startEditing(post)}>Edit</button>
                      <button type="button" onClick={() => { void handleDelete(post); }} disabled={isSaving}>Delete</button>
                      <Link to={`/blog/${post.slug}`} target="_blank" rel="noreferrer">Preview</Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
