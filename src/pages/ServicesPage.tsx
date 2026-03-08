import { NewsShell } from '@/components/news/NewsShell';

export function ServicesPage() {
  return (
    <NewsShell>
      <div className="services">
        <div className="services__hero">
          <h2 className="services__title">AlphaSec Services</h2>
          <p className="services__subtitle">Platform status, release history, and operational metrics.</p>
        </div>
      </div>
    </NewsShell>
  );
}
