import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';

type ResumeEntry = {
  title: string;
  subtitle: string;
  dateRange: string;
  bullets: string[];
};

const EXPERIENCE: ResumeEntry[] = [
  {
    title: 'Frontend Engineer',
    subtitle: 'Nova Systems Studio',
    dateRange: '2024 - Present',
    bullets: [
      'Built interactive React interfaces for mission dashboards and live data tooling.',
      'Shipped reusable UI components with accessibility-first keyboard and focus behavior.',
      'Partnered with product to turn rough concepts into polished, production-ready flows.',
    ],
  },
  {
    title: 'UI Developer',
    subtitle: 'Freelance Projects',
    dateRange: '2022 - 2024',
    bullets: [
      'Designed and implemented responsive marketing pages and app shells.',
      'Improved page load performance by reducing bundle weight and render work.',
      'Delivered tailored visual systems that matched each brand direction.',
    ],
  },
];

const PROJECTS: ResumeEntry[] = [
  {
    title: 'Star Wars Live Command Interface',
    subtitle: 'React, TypeScript, Zustand, Three.js',
    dateRange: 'Current',
    bullets: [
      'Created a cinematic landing experience with dynamic spotlight and parallax motion.',
      'Implemented authenticated map access with route-level protection and loading transitions.',
      'Built admin tooling for permissions and activity tracking.',
    ],
  },
];

const SKILLS = [
  'React',
  'TypeScript',
  'Tailwind/CSS',
  'State Management',
  'UI Animation',
  'Responsive Design',
  'Accessibility',
  'Supabase',
];

function ResumeSection({ title, entries }: { title: string; entries: ResumeEntry[] }) {
  return (
    <section className="resume-page__section">
      <h2 className="resume-page__section-title">{title}</h2>
      <div className="resume-page__entry-list">
        {entries.map((entry) => (
          <article key={`${entry.title}-${entry.subtitle}`} className="resume-page__entry">
            <header className="resume-page__entry-head">
              <div>
                <h3 className="resume-page__entry-title">{entry.title}</h3>
                <p className="resume-page__entry-subtitle">{entry.subtitle}</p>
              </div>
              <p className="resume-page__entry-date">{entry.dateRange}</p>
            </header>
            <ul className="resume-page__entry-bullets">
              {entry.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ResumePage() {
  const heroImageUrl = `${import.meta.env.BASE_URL}homepage-bg.jpg`;

  return (
    <main
      className="resume-page"
      aria-label="Resume"
      style={{ '--portfolio-hero-bg-image': `url("${heroImageUrl}")` } as CSSProperties}
    >
      <div className="resume-page__layer resume-page__layer--base" aria-hidden="true" />
      <div className="resume-page__layer resume-page__layer--grid" aria-hidden="true" />
      <div className="resume-page__layer resume-page__layer--veil" aria-hidden="true" />

      <div className="resume-page__content">
        <header className="resume-page__topbar">
          <Link to="/" className="resume-page__back-link">
            Back to Frontpage
          </Link>
          <button type="button" className="resume-page__download" disabled>
            PDF Coming Soon
          </button>
        </header>

        <section className="resume-page__hero">
          <p className="resume-page__kicker">Resume</p>
          <h1 className="resume-page__name">Alpha Sec</h1>
          <p className="resume-page__role">Frontend Engineer · Interactive Experiences</p>
          <p className="resume-page__meta">United States · alpha@example.com · github.com/Duresa7</p>
        </section>

        <div className="resume-page__grid">
          <ResumeSection title="Experience" entries={EXPERIENCE} />
          <ResumeSection title="Projects" entries={PROJECTS} />

          <section className="resume-page__section">
            <h2 className="resume-page__section-title">Skills</h2>
            <div className="resume-page__skills">
              {SKILLS.map((skill) => (
                <span key={skill} className="resume-page__skill-pill">
                  {skill}
                </span>
              ))}
            </div>
          </section>

          <section className="resume-page__section">
            <h2 className="resume-page__section-title">Education</h2>
            <article className="resume-page__entry">
              <header className="resume-page__entry-head">
                <div>
                  <h3 className="resume-page__entry-title">B.S. in Computer Science</h3>
                  <p className="resume-page__entry-subtitle">Temporary Placeholder University</p>
                </div>
                <p className="resume-page__entry-date">2020 - 2024</p>
              </header>
              <ul className="resume-page__entry-bullets">
                <li>Focus on software engineering, UI systems, and computer graphics fundamentals.</li>
                <li>Capstone centered on real-time visualization and interaction design.</li>
              </ul>
            </article>
          </section>
        </div>
      </div>
    </main>
  );
}
