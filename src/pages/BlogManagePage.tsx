import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  createBlogPost,
  deleteBlogPost,
  fetchAdminBlogPosts,
  normalizeBlogSlug,
  updateBlogPost,
} from '@/data/blogPosts';
import type { BlogPost, BlogPostMutationInput, BlogPostStatus } from '@/types/blog';
import { useAuthStore } from '@/store/authStore';

type BlogEditorState = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
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

  const selectedPost = useMemo(
    () => posts.find((post) => post.id === selectedPostId) || null,
    [posts, selectedPostId],
  );

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
      coverImageUrl: post.coverImageUrl || '',
      tagsText: post.tags.join(', '),
      status: post.status,
      publishedAtLocal: toLocalInputValue(post.publishedAt),
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
      if (!selectedPostId) {
        resetEditor();
      }
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
      className="alpha-blog"
      aria-label="Alpha Blog management"
      style={{ '--portfolio-hero-bg-image': `url("${heroImageUrl}")` } as CSSProperties}
    >
      <div className="alpha-blog__layer alpha-blog__layer--base" aria-hidden="true" />
      <div className="alpha-blog__layer alpha-blog__layer--grid" aria-hidden="true" />
      <div className="alpha-blog__layer alpha-blog__layer--veil" aria-hidden="true" />

      <div className="alpha-blog__shell alpha-blog__shell--manage">
        <header className="alpha-blog__masthead">
          <div>
            <p className="alpha-blog__eyebrow">Author Console</p>
            <h1 className="alpha-blog__title">Alpha Blog Manager</h1>
            <p className="alpha-blog__subtitle">
              Create, publish, edit, and retire posts.
            </p>
          </div>
          <div className="alpha-blog__masthead-actions">
            <Link to="/blog" className="alpha-blog__action alpha-blog__action--primary">
              View Public Blog
            </Link>
            <Link to="/" className="alpha-blog__action">
              Frontpage
            </Link>
          </div>
        </header>

        <div className="alpha-blog-manage">
          <section className="alpha-blog-manage__editor">
            <div className="alpha-blog-manage__section-head">
              <h2>{selectedPost ? `Editing: ${selectedPost.title}` : 'Create New Post'}</h2>
              {selectedPost && (
                <button type="button" className="alpha-blog__action" onClick={resetEditor}>
                  New Post
                </button>
              )}
            </div>

            <form className="alpha-blog-form" onSubmit={handleSubmit}>
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

              <label>
                <span>Slug</span>
                <input
                  value={editor.slug}
                  onChange={(event) => {
                    setSlugTouched(true);
                    setEditor((current) => ({ ...current, slug: normalizeBlogSlug(event.target.value) }));
                  }}
                  placeholder="alpha-blog-post-title"
                  required
                />
              </label>

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
                  placeholder="react, supabase, update"
                />
              </label>

              <label>
                <span>Body (Markdown supported)</span>
                <textarea
                  rows={14}
                  value={editor.content}
                  onChange={(event) => {
                    setEditor((current) => ({ ...current, content: event.target.value }));
                  }}
                  required
                />
              </label>

              <div className="alpha-blog-form__row">
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

              {error && <p className="alpha-blog-form__error">{error}</p>}

              <button type="submit" className="alpha-blog__action alpha-blog__action--primary" disabled={isSaving}>
                {isSaving ? 'Saving...' : selectedPost ? 'Update Post' : 'Publish Post'}
              </button>
            </form>
          </section>

          <section className="alpha-blog-manage__list">
            <div className="alpha-blog-manage__section-head">
              <h2>All Posts</h2>
              <span>{posts.length} total</span>
            </div>

            {isLoading ? (
              <p className="alpha-blog__empty">Loading posts...</p>
            ) : posts.length === 0 ? (
              <p className="alpha-blog__empty">No posts yet.</p>
            ) : (
              <div className="alpha-blog-manage__cards">
                {posts.map((post) => (
                  <article key={post.id} className="alpha-blog-manage__card">
                    <div className="alpha-blog-manage__card-head">
                      <h3>{post.title}</h3>
                      <span className={`alpha-blog-manage__status is-${post.status}`}>{post.status}</span>
                    </div>
                    <p className="alpha-blog-manage__slug">/{post.slug}</p>
                    <p className="alpha-blog-manage__meta">
                      {formatDate(post.publishedAt)} · {post.readingTimeMinutes} min
                    </p>
                    <p className="alpha-blog-manage__excerpt">{post.excerpt}</p>
                    <div className="alpha-blog-manage__actions">
                      <button type="button" onClick={() => startEditing(post)}>
                        Edit
                      </button>
                      <button type="button" onClick={() => { void handleDelete(post); }} disabled={isSaving}>
                        Delete
                      </button>
                      <Link to={`/blog/${post.slug}`} target="_blank" rel="noreferrer">
                        Preview
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
