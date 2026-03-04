import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Footer } from '@/components/Footer';

interface LegalShellProps {
  ariaLabel: string;
  children: ReactNode;
}

export function LegalShell({ ariaLabel, children }: LegalShellProps) {
  const heroImageUrl = `${import.meta.env.BASE_URL}homepage-bg.jpg`;

  return (
    <main
      className="legal-shell"
      aria-label={ariaLabel}
      style={{ '--portfolio-hero-bg-image': `url("${heroImageUrl}")` } as CSSProperties}
    >
      <div className="legal-shell__layer legal-shell__layer--base" aria-hidden="true" />
      <div className="legal-shell__layer legal-shell__layer--grid" aria-hidden="true" />
      <div className="legal-shell__layer legal-shell__layer--veil" aria-hidden="true" />

      <div className="legal-shell__content">
        <header className="legal-shell__topbar">
          <Link to="/" className="legal-shell__back-link">Back to Frontpage</Link>
        </header>

        <div className="legal-page">
          {children}
        </div>
      </div>

      <Footer />
    </main>
  );
}
