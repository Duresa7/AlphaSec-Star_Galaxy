import { useState, useEffect } from 'react';
import { NewsShell } from '@/components/news/NewsShell';
import { SERVICE_STATUSES } from '@/data/newsMockData';
import { fetchTimelineEntries } from '@/data/timelineStorage';
import type { ServiceStatus } from '@/data/newsMockData';
import type { TimelineEntry } from '@/data/timelineStorage';

function formatTimelineDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function StatusCard({ status }: { status: ServiceStatus }) {
  return (
    <div className="status-card">
      <div className="status-card__header">
        <span className="status-card__name">{status.name}</span>
        <div className={`status-card__dot status-card__dot--${status.status}`} />
      </div>
      {status.metric ? (
        <>
          <p className="status-card__metric">{status.metric}</p>
          <p className="status-card__label">{status.metricLabel}</p>
        </>
      ) : (
        <>
          <p className={`status-card__status-text status-card__status-text--${status.status}`}>
            {status.status}
          </p>
          <p className="status-card__label">{status.description}</p>
        </>
      )}
    </div>
  );
}

function TimelineItem({ entry }: { entry: TimelineEntry }) {
  return (
    <details className={`timeline-item timeline-item--${entry.type}`}>
      <summary>
        <span className={`timeline-item__type timeline-item__type--${entry.type}`}>
          {entry.type}
        </span>
        <span className="timeline-item__title">{entry.title}</span>
        <span className="timeline-item__time">{formatTimelineDate(entry.timestamp)}</span>
      </summary>
      <div className="timeline-item__content">
        {entry.expandedContent}
      </div>
    </details>
  );
}

export function ServicesPage() {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchTimelineEntries().then((data) => {
      if (!cancelled) setEntries(data);
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <NewsShell>
      <div className="services-dash">
        <header className="services-dash__header">
          <h1 className="services-dash__title">AlphaSec Services</h1>
          <p className="services-dash__subtitle">
            Platform status, release history, and operational metrics.
          </p>
        </header>

        <div className="services-dash__grid">
          {SERVICE_STATUSES.map(status => (
            <StatusCard key={status.id} status={status} />
          ))}
        </div>

        <section className="services-dash__timeline">
          <h2 className="services-dash__timeline-header">Latest Updates</h2>
          {entries.length === 0 && (
            <p className="article-dash__empty">No updates yet.</p>
          )}
          {entries.length > 0 && (
            <div className="gh-timeline">
              {entries.map(entry => (
                <TimelineItem key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </section>
      </div>
    </NewsShell>
  );
}
