import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function LandingPage() {
  const navigate = useNavigate();
  const [isLaunching, setIsLaunching] = useState(false);
  const [isRevealVisible, setIsRevealVisible] = useState(false);
  const revealSectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const target = revealSectionRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setIsRevealVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const handleLaunch = () => {
    if (isLaunching) return;
    setIsLaunching(true);
    window.setTimeout(() => navigate('/map'), 900);
  };

  return (
    <div className={`orb-shell${isLaunching ? ' is-launching' : ''}`}>
      <div className="orb-bg" aria-hidden="true" />
      <div className="orb-stars" aria-hidden="true" />
      <div className={`orb-warp${isLaunching ? ' is-active' : ''}`} aria-hidden="true" />

      <header className="orb-topbar">
        <div className="orb-brand">
          <span className="orb-brand-mark" />
          <div>
            <p className="orb-brand-kicker">Old Republic Cartography</p>
            <h1 className="orb-brand-title">Star Wars Live</h1>
          </div>
        </div>
        <p className="orb-topbar-status">Sith Conflict Simulation Online</p>
      </header>

      <main className="orb-main">
        <section className="orb-hero">
          <div className="orb-glass orb-hero-card">
            <p className="orb-hero-kicker">Soft Command Deck</p>
            <h2 className="orb-hero-title">Shape a living Sith-era galaxy map.</h2>
            <p className="orb-hero-copy">
              Build custom planets, assign fleet routes, and alter faction control in a strategy
              sandbox designed for continuous worldbuilding.
            </p>
            <div className="orb-cta-row">
              <button type="button" className="orb-btn-primary" onClick={handleLaunch} disabled={isLaunching}>
                Launch Here
              </button>
              <a className="orb-btn-secondary" href="#planets">
                Explore Planets
              </a>
            </div>
          </div>

          <aside className="orb-glass orb-command-card">
            <p className="orb-command-label">Conflict Snapshot</p>
            <div className="orb-stat-grid">
              <div className="orb-stat">
                <span className="orb-stat-key">Tracked Planets</span>
                <span className="orb-stat-value">208</span>
              </div>
              <div className="orb-stat">
                <span className="orb-stat-key">Active Fleets</span>
                <span className="orb-stat-value">93</span>
              </div>
              <div className="orb-stat">
                <span className="orb-stat-key">Border Changes</span>
                <span className="orb-stat-value">41</span>
              </div>
              <div className="orb-stat">
                <span className="orb-stat-key">Factions</span>
                <span className="orb-stat-value">6</span>
              </div>
            </div>
          </aside>
        </section>

        <section
          id="planets"
          ref={revealSectionRef}
          className={`orb-features-reveal${isRevealVisible ? ' is-visible' : ''}`}
        >
          <h3 className="orb-section-title">Operational Planets</h3>
          <p className="orb-section-copy">
            Every tool mirrors the way your galaxy evolves: creation, command, and control.
          </p>

          <div className="orb-features-grid">
            <article className="orb-glass orb-feature-card">
              <h4>Planet Registry</h4>
              <p>Create original planets with allegiance, economy, and strategic profile.</p>
            </article>
            <article className="orb-glass orb-feature-card">
              <h4>Fleet Routing</h4>
              <p>Send armadas across lanes and monitor pressure points in real time.</p>
            </article>
            <article className="orb-glass orb-feature-card">
              <h4>Territory Layer</h4>
              <p>Redraw control zones and watch influence push across connected worlds.</p>
            </article>
            <article className="orb-glass orb-feature-card">
              <h4>Faction Control</h4>
              <p>Switch planet ownership instantly to simulate campaigns and outcomes.</p>
            </article>
          </div>
        </section>

        <section className="orb-sections">
          <article className="orb-glass orb-section-card">
            <p className="orb-section-chip">Scenario Building</p>
            <h3>Craft your own Old Republic narrative.</h3>
            <p>
              Prototype alternate timelines, test diplomatic outcomes, and prepare campaign arcs
              directly on the map canvas.
            </p>
          </article>
          <article className="orb-glass orb-section-card">
            <p className="orb-section-chip">Command Speed</p>
            <h3>Designed for fast strategic iteration.</h3>
            <p>
              Adjust fleets and factions with minimal friction, then immediately evaluate the new
              balance of power.
            </p>
          </article>
        </section>
      </main>

      <footer className="orb-footer">
        <div className="orb-footer-left">
          <span className="orb-footer-dot" />
          Built for custom galaxy operations
        </div>
      </footer>
    </div>
  );
}
