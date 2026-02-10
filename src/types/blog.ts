export type BlogPostStatus = 'draft' | 'published';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  coverImageUrl: string | null;
  tags: string[];
  status: BlogPostStatus;
  readingTimeMinutes: number;
  publishedAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPostMutationInput {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  coverImageUrl: string | null;
  tags: string[];
  status: BlogPostStatus;
  publishedAt: string | null;
}
