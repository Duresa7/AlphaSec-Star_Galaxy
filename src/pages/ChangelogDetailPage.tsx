import { Link, useParams, Navigate } from 'react-router-dom';
import { NewsShell } from '@/components/news/NewsShell';
import { CHANGELOG, CHANGE_TYPE_LABELS } from '@/data/changelogData';

export function ChangelogDetailPage() {
  const { version } = useParams<{ version: string }>();
  const entry = CHANGELOG.find(e => e.version === version);

  if (!entry) return <Navigate to="/changelog" replace />;

  const currentIndex = CHANGELOG.indexOf(entry);
  const prev = CHANGELOG[currentIndex + 1];
  const next = CHANGELOG[currentIndex - 1];

  return (
    <NewsShell>
      <div className="changelog-detail">
        <Link to="/changelog" className="changelog-detail__back">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
          All releases
        </Link>

        <header className="changelog-detail__header">
          <h2 className="changelog-detail__version">{entry.version}</h2>
          <span className="changelog-detail__date">{entry.date}</span>
        </header>

        <p className="changelog-detail__summary">{entry.summary}</p>

        <div className="changelog-detail__changes">
          {(['added', 'changed', 'fixed', 'removed'] as const).map(type => {
            const items = entry.changes.filter(c => c.type === type);
            if (items.length === 0) return null;
            return (
              <section key={type} className="changelog-detail__section">
                <h3 className={`changelog-detail__section-title changelog-detail__section-title--${type}`}>
                  {CHANGE_TYPE_LABELS[type]}
                </h3>
                <ul className="changelog-detail__list">
                  {items.map((change, i) => (
                    <li key={i} className="changelog-detail__item">{change.text}</li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>

        <nav className="changelog-detail__nav">
          {prev ? (
            <Link to={`/changelog/${prev.version}`} className="changelog-detail__nav-link changelog-detail__nav-link--prev">
              <span className="changelog-detail__nav-label">← Previous</span>
              <span className="changelog-detail__nav-version">{prev.version}</span>
            </Link>
          ) : <span />}
          {next ? (
            <Link to={`/changelog/${next.version}`} className="changelog-detail__nav-link changelog-detail__nav-link--next">
              <span className="changelog-detail__nav-label">Next →</span>
              <span className="changelog-detail__nav-version">{next.version}</span>
            </Link>
          ) : <span />}
        </nav>
      </div>
    </NewsShell>
  );
}
