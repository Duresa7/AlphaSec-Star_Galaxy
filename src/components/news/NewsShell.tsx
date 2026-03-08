import { Link, useLocation } from 'react-router-dom';
import { Footer } from '@/components/Footer';

const NAV_ITEMS = [
  { path: '/news', label: 'News' },
  { path: '/services', label: 'AlphaSec Services' },
  { path: '/changelog', label: 'Update Logs' },
  { path: '/blog', label: 'Blog' },
];

export function NewsShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();

  return (
    <main className="news-page" aria-label="AlphaSec News">
      <div className="news-page__layer news-page__layer--base" aria-hidden="true" />
      <div className="news-page__layer news-page__layer--veil" aria-hidden="true" />

      <div className="news-page__content">
        <header className="news-page__header">
          <div className="news-page__header-left">
            <Link to="/" className="news-page__back-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5" />
                <path d="m12 19-7-7 7-7" />
              </svg>
              Home
            </Link>
          </div>
          <h1 className="news-page__brand">AlphaSec United News</h1>
        </header>

        <nav className="news-page__categories" aria-label="News categories">
          {NAV_ITEMS.map(item => {
            const isActive = item.path === '/news'
              ? pathname === '/news'
              : pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`news-page__category-pill${isActive ? ' news-page__category-pill--active' : ''}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {children}
      </div>

      <Footer />
    </main>
  );
}
