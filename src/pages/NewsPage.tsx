import { NewsShell } from '@/components/news/NewsShell';

export function NewsPage() {
  return (
    <NewsShell>
      <div className="news-page__empty">
        <p className="news-page__empty-text">News articles and AlphaSec updates will go live here.</p>
      </div>
    </NewsShell>
  );
}
