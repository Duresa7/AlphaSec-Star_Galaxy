import { Link } from 'react-router-dom';
import { NewsShell } from '@/components/news/NewsShell';
import { CHANGELOG } from '@/data/changelogData';

export function ChangelogPage() {
  return (
    <NewsShell>
      <div className="changelog">
        <div className="changelog__header">
          <h2 className="changelog__title">Changelog</h2>
          <p className="changelog__subtitle">All notable changes to Alpha Control are documented here.</p>
        </div>
        <div className="changelog__timeline">
          {CHANGELOG.map((entry) => (
            <article key={entry.version} className="changelog__entry">
              <div className="changelog__entry-marker" aria-hidden="true" />
              <div className="changelog__entry-content">
                <div className="changelog__entry-header">
                  <span className="changelog__version">{entry.version}</span>
                  <span className="changelog__date">{entry.date}</span>
                </div>
                <p className="changelog__summary">{entry.summary}</p>
                <Link
                  to={`/changelog/${entry.version}`}
                  className="changelog__read-more"
                >
                  Read more →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </NewsShell>
  );
}
