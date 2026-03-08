import { NewsShell } from '@/components/news/NewsShell';

interface BlogPost {
  date: string;
  title: string;
  excerpt: string;
  readTime: string;
  tags: string[];
  featured?: boolean;
}

const BLOG_POSTS: BlogPost[] = [
  { date: 'Feb 28, 2026', title: 'The Architecture Behind a Real-Time Galactic Command Dashboard', excerpt: 'A multi-part deep dive into how we built Alpha Control from the ground up. From WebGL rendering pipelines and spatial indexing to Zustand state management and Supabase edge functions, this is the full engineering story.', readTime: '18 min read', tags: ['Architecture', 'Engineering'], featured: true },
  { date: 'Feb 27, 2026', title: 'Behind the Scenes: Building a 3D Star Map with React Three Fiber', excerpt: 'A deep dive into the technical challenges of rendering thousands of interactive markers in a WebGL scene without melting your GPU.', readTime: '12 min read', tags: ['Three.js', 'WebGL'] },
  { date: 'Feb 15, 2026', title: 'From Prototype to Production: Lessons Shipping a WebGL App', excerpt: 'We shipped our first internal build in 3 weeks. Here is everything that broke, and how we fixed it before going live.', readTime: '9 min read', tags: ['Shipping', 'Lessons'] },
  { date: 'Feb 14, 2026', title: 'Designing Accessible Interfaces for High-Density Data', excerpt: 'How we ensure that color-blind users, screen reader users, and keyboard-only navigators can operate the full command dashboard effectively.', readTime: '7 min read', tags: ['Accessibility', 'Design'] },
  { date: 'Feb 3, 2026', title: 'Why We Chose Zustand Over Redux for Galactic-Scale State', excerpt: 'Managing state for a real-time command dashboard with dozens of concurrent data streams required a fundamentally different approach.', readTime: '10 min read', tags: ['Zustand', 'State'] },
  { date: 'Feb 1, 2026', title: 'State Management at Scale: Zustand in a Real-Time Dashboard', excerpt: 'How 4 Zustand stores handle concurrent updates from WebSocket feeds, user interactions, and background sync without breaking a sweat.', readTime: '14 min read', tags: ['Zustand', 'Performance'] },
  { date: 'Jan 15, 2026', title: 'How We Render 10,000 Stars Without Dropping Frames', excerpt: 'An engineering breakdown of the instanced rendering pipeline that powers the galaxy map. From GPU batching to spatial indexing, here is how we keep it smooth.', readTime: '16 min read', tags: ['Rendering', 'Performance'] },
  { date: 'Jan 2, 2026', title: 'Designing for the Dark Side: Our UI Philosophy', excerpt: 'How we built an interface that feels like a military command console without sacrificing usability.', readTime: '6 min read', tags: ['UI', 'Design'] },
];

export function BlogPage() {
  const featured = BLOG_POSTS.find(p => p.featured);
  const rest = BLOG_POSTS.filter(p => !p.featured);

  return (
    <NewsShell>
      <div className="blog">
        {featured && (
          <article className="blog__featured">
            <div className="blog__featured-image" aria-hidden="true" />
            <div className="blog__featured-body">
              <div className="blog__featured-meta">
                <span className="blog__featured-date">{featured.date}</span>
                <span className="blog__featured-readtime">{featured.readTime}</span>
              </div>
              <h2 className="blog__featured-title">{featured.title}</h2>
              <p className="blog__featured-excerpt">{featured.excerpt}</p>
              <div className="blog__featured-tags">
                {featured.tags.map(tag => (
                  <span key={tag} className="blog__tag">{tag}</span>
                ))}
              </div>
            </div>
          </article>
        )}

        <div className="blog__grid">
          {rest.map((post) => (
            <article key={post.title} className="blog__post">
              <div className="blog__post-image" aria-hidden="true" />
              <div className="blog__post-body">
                <div className="blog__post-meta">
                  <span className="blog__post-date">{post.date}</span>
                  <span className="blog__post-readtime">{post.readTime}</span>
                </div>
                <h3 className="blog__post-title">{post.title}</h3>
                <p className="blog__post-excerpt">{post.excerpt}</p>
                <div className="blog__post-tags">
                  {post.tags.map(tag => (
                    <span key={tag} className="blog__tag">{tag}</span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </NewsShell>
  );
}
