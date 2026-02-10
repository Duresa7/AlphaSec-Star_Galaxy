import { supabase } from '@/lib/supabase';
import { logActivity } from '@/data/activityLog';
import type { Database } from '@/types/database';
import type { BlogPost, BlogPostMutationInput } from '@/types/blog';

type BlogPostRow = Database['public']['Tables']['blog_posts']['Row'];

const WORDS_PER_MINUTE = 220;

export function normalizeCategorySlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function formatCategoryLabel(value: string): string {
  const normalized = normalizeCategorySlug(value);
  if (!normalized) return 'General';
  return normalized
    .split('-')
    .filter(Boolean)
    .map((word) => word.slice(0, 1).toUpperCase() + word.slice(1))
    .join(' ');
}

const toBlogPost = (row: BlogPostRow): BlogPost => ({
  category: normalizeCategorySlug(row.category || row.tags?.[0] || 'general') || 'general',
  id: row.id,
  slug: row.slug,
  title: row.title,
  excerpt: row.excerpt,
  content: row.content,
  coverImageUrl: row.cover_image_url,
  tags: row.tags || [],
  status: row.status,
  readingTimeMinutes: row.reading_time_minutes,
  publishedAt: row.published_at,
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

async function getAuthUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

export function normalizeBlogSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function estimateReadingTimeMinutes(content: string): number {
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount === 0) return 1;
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
}

function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const next: string[] = [];
  for (const tag of tags) {
    const cleaned = tag.trim().toLowerCase();
    if (!cleaned || seen.has(cleaned)) continue;
    seen.add(cleaned);
    next.push(cleaned);
  }
  return next;
}

function normalizeMutationInput(input: BlogPostMutationInput): BlogPostMutationInput {
  const normalizedCategory = normalizeCategorySlug(input.category || input.tags[0] || 'general') || 'general';
  return {
    ...input,
    slug: normalizeBlogSlug(input.slug),
    title: input.title.trim(),
    excerpt: input.excerpt.trim(),
    content: input.content.trim(),
    category: normalizedCategory,
    coverImageUrl: input.coverImageUrl?.trim() || null,
    tags: normalizeTags(input.tags),
  };
}

export async function fetchLatestPublishedPosts(limit = 24): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch published blog posts:', error);
    return [];
  }

  return ((data || []) as BlogPostRow[]).map(toBlogPost);
}

export async function fetchPublishedPostBySlug(slug: string): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', normalizeBlogSlug(slug))
    .eq('status', 'published')
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch blog post by slug:', error);
    return null;
  }

  if (!data) return null;
  return toBlogPost(data as BlogPostRow);
}

export async function fetchAdminBlogPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch admin blog posts:', error);
    return [];
  }

  return ((data || []) as BlogPostRow[]).map(toBlogPost);
}

export async function createBlogPost(input: BlogPostMutationInput): Promise<BlogPost | null> {
  const userId = await getAuthUserId();
  const next = normalizeMutationInput(input);
  const publishedAt =
    next.status === 'published'
      ? (next.publishedAt || new Date().toISOString())
      : null;

  const { data, error } = await supabase
    .from('blog_posts')
    .insert({
      slug: next.slug,
      title: next.title,
      excerpt: next.excerpt,
      content: next.content,
      category: next.category,
      cover_image_url: next.coverImageUrl,
      tags: next.tags,
      status: next.status,
      reading_time_minutes: estimateReadingTimeMinutes(next.content),
      published_at: publishedAt,
      created_by: userId,
    })
    .select('*')
    .single();

  if (error) {
    console.error('Failed to create blog post:', error);
    throw error;
  }

  if (!data) {
    throw new Error('No blog post returned after create.');
  }

  const row = data as BlogPostRow;

  await logActivity({
    eventType: 'blog_post_created',
    entityType: 'blog_post',
    entityId: row.id,
    message: `Created blog post "${row.title}"`,
    metadata: { status: row.status, slug: row.slug },
  });

  return toBlogPost(row);
}

export async function updateBlogPost(id: string, input: BlogPostMutationInput): Promise<BlogPost | null> {
  const next = normalizeMutationInput(input);
  const publishedAt =
    next.status === 'published'
      ? (next.publishedAt || new Date().toISOString())
      : null;

  const { data, error } = await supabase
    .from('blog_posts')
    .update({
      slug: next.slug,
      title: next.title,
      excerpt: next.excerpt,
      content: next.content,
      category: next.category,
      cover_image_url: next.coverImageUrl,
      tags: next.tags,
      status: next.status,
      reading_time_minutes: estimateReadingTimeMinutes(next.content),
      published_at: publishedAt,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('Failed to update blog post:', error);
    throw error;
  }

  if (!data) {
    throw new Error('No blog post returned after update.');
  }

  const row = data as BlogPostRow;

  await logActivity({
    eventType: 'blog_post_updated',
    entityType: 'blog_post',
    entityId: row.id,
    message: `Updated blog post "${row.title}"`,
    metadata: { status: row.status, slug: row.slug },
  });

  return toBlogPost(row);
}

export async function deleteBlogPost(id: string): Promise<void> {
  const { data: existing } = await supabase.from('blog_posts').select('title').eq('id', id).maybeSingle();

  const { error } = await supabase.from('blog_posts').delete().eq('id', id);
  if (error) {
    console.error('Failed to delete blog post:', error);
    throw error;
  }

  await logActivity({
    eventType: 'blog_post_deleted',
    entityType: 'blog_post',
    entityId: id,
    message: `Deleted blog post "${existing?.title ?? id}"`,
  });
}
