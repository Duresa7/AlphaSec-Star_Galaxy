import { NewsShell } from '@/components/news/NewsShell';
import { CHANGELOG } from '@/data/changelogData';

const STATUS_ITEMS: { label: string; value: string; state: 'operational' | 'degraded' | 'down' }[] = [
  { label: 'Uptime', value: '99.97%', state: 'operational' },
  { label: 'Total Unique Visits', value: '148,203', state: 'operational' },
  { label: 'Supabase Status', value: 'Operational', state: 'operational' },
  { label: 'Vercel Status', value: 'Operational', state: 'operational' },
];

export function ServicesPage() {
  return (
    <NewsShell>
      <div className="services">
        <div className="services__hero">
          <h2 className="services__title">AlphaSec Services</h2>
          <p className="services__subtitle">Platform status, release history, and operational metrics.</p>
        </div>

        <div className="services__split">
          <div className="services__changelog-col">
            <h3 className="services__col-heading">Release History</h3>
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
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="services__status-col">
            <h3 className="services__col-heading">Platform Status</h3>
            <div className="services__status-list">
              {STATUS_ITEMS.map((item) => (
                <div key={item.label} className="services__status-row">
                  <div className="services__status-info">
                    <span className={`services__status-dot services__status-dot--${item.state}`} />
                    <span className="services__status-label">{item.label}</span>
                  </div>
                  <span className="services__status-value">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="services__status-summary">
              <span className="services__status-dot services__status-dot--operational" />
              <span className="services__status-summary-text">All systems operational</span>
            </div>

            <div className="services__last-checked">
              Last checked: {new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </div>
    </NewsShell>
  );
}
