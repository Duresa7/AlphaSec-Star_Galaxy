import { useCallback, useEffect, useRef, useState, type ComponentType, type CSSProperties } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from '@/components/auth/AuthModal';

type Point = {
  x: number;
  y: number;
};

type Bounds = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type EchoParticle = {
  id: number;
  x: number;
  y: number;
  size: number;
  createdAt: number;
};

type SocialLink = {
  href: string;
  ariaLabel: string;
  Icon: ComponentType;
};

const DESKTOP_RADIUS = 160;
const MOBILE_RADIUS = 120;
const PARALLAX_LIMIT = 10;
const GRID_LIMIT = 18;
const MAX_ECHOES = 8;
const ECHO_LIFETIME_MS = 450;
const ECHO_SPEED_THRESHOLD = 1.2;
const ECHO_SPAWN_COOLDOWN_MS = 42;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const getMediaMatch = (query: string, fallback: boolean) => {
  if (typeof window === 'undefined') return fallback;
  return window.matchMedia(query).matches;
};
const centerOf = (bounds: Bounds): Point => ({ x: bounds.width / 2, y: bounds.height / 2 });

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 .5C5.65.5.5 5.67.5 12.05c0 5.11 3.3 9.44 7.88 10.97.58.1.8-.25.8-.56 0-.28-.02-1.2-.02-2.16-2.88.53-3.62-.7-3.84-1.34-.12-.33-.62-1.34-1.06-1.61-.36-.2-.86-.7-.01-.72.8-.02 1.38.73 1.57 1.03.91 1.53 2.36 1.09 2.94.83.09-.67.36-1.1.64-1.35-2.55-.29-5.21-1.28-5.21-5.67 0-1.25.44-2.28 1.17-3.09-.12-.29-.51-1.48.11-3.08 0 0 .95-.3 3.12 1.18a10.73 10.73 0 0 1 5.68 0c2.17-1.49 3.12-1.18 3.12-1.18.62 1.6.23 2.79.11 3.08.73.81 1.17 1.83 1.17 3.09 0 4.4-2.67 5.38-5.22 5.67.41.36.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.22.67.8.56a11.56 11.56 0 0 0 7.88-10.97C23.5 5.67 18.35.5 12 .5Z"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M18.92 2H22l-6.73 7.7L23.2 22h-6.23l-4.87-7.03L5.95 22H2.87l7.2-8.23L.8 2h6.37l4.4 6.4L18.92 2Zm-1.09 18h1.73L6.22 3.88H4.37L17.83 20Z"
      />
    </svg>
  );
}

function GalaxyMapIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M5.25 3.5a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 0 0 0-3.5Zm13.5 0a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 0 0 0-3.5ZM3.5 18.75a1.75 1.75 0 1 0 3.5 0 1.75 1.75 0 0 0-3.5 0Zm13.5 0a1.75 1.75 0 1 0 3.5 0 1.75 1.75 0 0 0-3.5 0ZM12 8.25a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Zm-6.2-2.28a.75.75 0 0 1 1.06 0l1.88 1.88a.75.75 0 0 1-1.06 1.06L5.8 7.03a.75.75 0 0 1 0-1.06Zm12.4 0a.75.75 0 0 1 0 1.06L16.32 8.9a.75.75 0 0 1-1.06-1.06l1.88-1.88a.75.75 0 0 1 1.06 0ZM6.86 17.14a.75.75 0 0 1 0 1.06L4.98 20.1a.75.75 0 1 1-1.06-1.06l1.88-1.9a.75.75 0 0 1 1.06 0Zm10.28 0 1.88 1.9a.75.75 0 0 1-1.06 1.06l-1.88-1.9a.75.75 0 0 1 1.06-1.06ZM12 0a.75.75 0 0 1 .75.75v4a.75.75 0 0 1-1.5 0v-4A.75.75 0 0 1 12 0Zm0 19.25a.75.75 0 0 1 .75.75v3.25a.75.75 0 0 1-1.5 0V20a.75.75 0 0 1 .75-.75ZM0 12a.75.75 0 0 1 .75-.75h4a.75.75 0 0 1 0 1.5h-4A.75.75 0 0 1 0 12Zm19.25 0a.75.75 0 0 1 .75-.75h3.25a.75.75 0 0 1 0 1.5H20a.75.75 0 0 1-.75-.75Z"
      />
    </svg>
  );
}

function ResumeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M7.75 2.5A2.25 2.25 0 0 0 5.5 4.75v14.5A2.25 2.25 0 0 0 7.75 21.5h8.5a2.25 2.25 0 0 0 2.25-2.25V8.78a2.25 2.25 0 0 0-.66-1.59l-3.03-3.03a2.25 2.25 0 0 0-1.59-.66H7.75Zm5.5 1.7v3.55c0 .55.45 1 1 1h3.55v10.5a1.55 1.55 0 0 1-1.55 1.55h-8.5a1.55 1.55 0 0 1-1.55-1.55V4.75c0-.86.7-1.55 1.55-1.55h5.5Zm1.7.5 2.85 2.85H14.95V4.7ZM8.5 11.2c0-.2.16-.35.35-.35h6.3a.35.35 0 0 1 0 .7h-6.3a.35.35 0 0 1-.35-.35Zm0 3.1c0-.2.16-.35.35-.35h6.3a.35.35 0 1 1 0 .7h-6.3a.35.35 0 0 1-.35-.35Zm0 3.1c0-.2.16-.35.35-.35h3.7a.35.35 0 1 1 0 .7h-3.7a.35.35 0 0 1-.35-.35Z"
      />
    </svg>
  );
}

const SOCIAL_LINKS: SocialLink[] = [
  {
    href: 'https://github.com/Duresa7',
    ariaLabel: 'GitHub profile',
    Icon: GitHubIcon,
  },
  {
    href: 'https://x.com/AlphaFLy_TV',
    ariaLabel: 'X profile',
    Icon: XIcon,
  },
];

export function LandingPage() {
  const heroImageUrl = `${import.meta.env.BASE_URL}homepage-bg.jpg`;
  const { session, profile, signOut } = useAuth();
  const location = useLocation();
  const locationState = location.state as { showAuthModal?: boolean } | null;
  const [showAuthModal, setShowAuthModal] = useState(locationState?.showAuthModal ?? false);
  const heroRef = useRef<HTMLElement | null>(null);
  const boundsRef = useRef<Bounds>({ left: 0, top: 0, width: 1, height: 1 });
  const targetCursorRef = useRef<Point>({ x: 0, y: 0 });
  const displayCursorRef = useRef<Point>({ x: 0, y: 0 });
  const pointerRef = useRef({ x: 0, y: 0, time: 0 });
  const initializedRef = useRef(false);
  const nextEchoIdRef = useRef(1);
  const lastEchoAtRef = useRef(0);

  const [echoes, setEchoes] = useState<EchoParticle[]>([]);
  const [isFinePointer, setIsFinePointer] = useState<boolean>(() => getMediaMatch('(pointer: fine)', true));
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() =>
    getMediaMatch('(prefers-reduced-motion: reduce)', false)
  );

  const spawnEcho = useCallback((x: number, y: number, speed: number, createdAt: number) => {
    const size = clamp(118 + speed * 20, 118, 220);
    const id = nextEchoIdRef.current;
    nextEchoIdRef.current += 1;

    setEchoes((current) => {
      const nextEcho: EchoParticle = { id, x, y, size, createdAt };
      if (current.length >= MAX_ECHOES) {
        return [...current.slice(1), nextEcho];
      }

      return [...current, nextEcho];
    });

    lastEchoAtRef.current = createdAt;
  }, []);

  const syncBounds = useCallback(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const rect = hero.getBoundingClientRect();
    const nextBounds: Bounds = {
      left: rect.left,
      top: rect.top,
      width: Math.max(rect.width, 1),
      height: Math.max(rect.height, 1),
    };
    boundsRef.current = nextBounds;

    if (!initializedRef.current) {
      initializedRef.current = true;
      const center = centerOf(nextBounds);
      targetCursorRef.current = center;
      displayCursorRef.current = center;
      pointerRef.current = { ...center, time: performance.now() };
      return;
    }

    targetCursorRef.current.x = clamp(targetCursorRef.current.x, 0, nextBounds.width);
    targetCursorRef.current.y = clamp(targetCursorRef.current.y, 0, nextBounds.height);
    displayCursorRef.current.x = clamp(displayCursorRef.current.x, 0, nextBounds.width);
    displayCursorRef.current.y = clamp(displayCursorRef.current.y, 0, nextBounds.height);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const pointerMedia = window.matchMedia('(pointer: fine)');
    const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');

    const syncMediaState = () => {
      setIsFinePointer(pointerMedia.matches);
      setPrefersReducedMotion(motionMedia.matches);
    };

    syncMediaState();
    pointerMedia.addEventListener('change', syncMediaState);
    motionMedia.addEventListener('change', syncMediaState);

    return () => {
      pointerMedia.removeEventListener('change', syncMediaState);
      motionMedia.removeEventListener('change', syncMediaState);
    };
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    let rafId = 0;
    const handlePointerMove = (event: PointerEvent) => {
      if (!isFinePointer) return;

      const { left, top, width, height } = boundsRef.current;
      const x = clamp(event.clientX - left, 0, width);
      const y = clamp(event.clientY - top, 0, height);
      const now = performance.now();

      targetCursorRef.current.x = x;
      targetCursorRef.current.y = y;

      const deltaX = x - pointerRef.current.x;
      const deltaY = y - pointerRef.current.y;
      const deltaTime = Math.max(now - pointerRef.current.time, 1);
      const speed = Math.hypot(deltaX, deltaY) / deltaTime;

      if (
        !prefersReducedMotion &&
        speed > ECHO_SPEED_THRESHOLD &&
        now - lastEchoAtRef.current > ECHO_SPAWN_COOLDOWN_MS
      ) {
        spawnEcho(displayCursorRef.current.x, displayCursorRef.current.y, speed, now);
      }

      pointerRef.current = { x, y, time: now };
    };

    syncBounds();
    hero.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('resize', syncBounds);
    window.addEventListener('scroll', syncBounds, { passive: true });

    const renderFrame = (time: number) => {
      const bounds = boundsRef.current;
      const center = centerOf(bounds);

      if (!isFinePointer) {
        if (prefersReducedMotion) {
          targetCursorRef.current.x = center.x;
          targetCursorRef.current.y = center.y;
        } else {
          targetCursorRef.current.x = clamp(
            center.x + Math.cos(time * 0.00038) * bounds.width * 0.25,
            0,
            bounds.width
          );
          targetCursorRef.current.y = clamp(
            center.y + Math.sin(time * 0.00031) * bounds.height * 0.2,
            0,
            bounds.height
          );
        }
      }

      const lerp = prefersReducedMotion ? 0.2 : 0.14;
      displayCursorRef.current.x += (targetCursorRef.current.x - displayCursorRef.current.x) * lerp;
      displayCursorRef.current.y += (targetCursorRef.current.y - displayCursorRef.current.y) * lerp;

      const normalizedX = center.x > 0 ? (displayCursorRef.current.x - center.x) / center.x : 0;
      const normalizedY = center.y > 0 ? (displayCursorRef.current.y - center.y) / center.y : 0;

      const parallaxX = prefersReducedMotion
        ? 0
        : clamp(-normalizedX * PARALLAX_LIMIT, -PARALLAX_LIMIT, PARALLAX_LIMIT);
      const parallaxY = prefersReducedMotion
        ? 0
        : clamp(-normalizedY * PARALLAX_LIMIT, -PARALLAX_LIMIT, PARALLAX_LIMIT);
      const gridX = prefersReducedMotion ? 0 : clamp(-normalizedX * GRID_LIMIT, -GRID_LIMIT, GRID_LIMIT);
      const gridY = prefersReducedMotion ? 0 : clamp(-normalizedY * GRID_LIMIT, -GRID_LIMIT, GRID_LIMIT);
      const spotlightRadius =
        bounds.width <= 768 ? MOBILE_RADIUS : isFinePointer ? DESKTOP_RADIUS : MOBILE_RADIUS;

      hero.style.setProperty('--cursor-x', `${displayCursorRef.current.x.toFixed(2)}px`);
      hero.style.setProperty('--cursor-y', `${displayCursorRef.current.y.toFixed(2)}px`);
      hero.style.setProperty('--spotlight-radius', `${spotlightRadius}px`);
      hero.style.setProperty('--parallax-x', `${parallaxX.toFixed(2)}px`);
      hero.style.setProperty('--parallax-y', `${parallaxY.toFixed(2)}px`);
      hero.style.setProperty('--grid-x', `${gridX.toFixed(2)}px`);
      hero.style.setProperty('--grid-y', `${gridY.toFixed(2)}px`);

      rafId = window.requestAnimationFrame(renderFrame);
    };

    rafId = window.requestAnimationFrame(renderFrame);

    return () => {
      hero.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', syncBounds);
      window.removeEventListener('scroll', syncBounds);
      window.cancelAnimationFrame(rafId);
    };
  }, [isFinePointer, prefersReducedMotion, spawnEcho, syncBounds]);

  useEffect(() => {
    const cleanupTicker = window.setInterval(() => {
      const now = performance.now();
      setEchoes((current) => {
        if (current.length === 0) return current;
        const remaining = current.filter((echo) => now - echo.createdAt < ECHO_LIFETIME_MS);
        return remaining.length === current.length ? current : remaining;
      });
    }, 70);

    return () => window.clearInterval(cleanupTicker);
  }, []);

  const renderSocialLinks = (interactive: boolean) =>
    SOCIAL_LINKS.map(({ href, ariaLabel, Icon }) =>
      interactive ? (
        <a
          key={href}
          className="portfolio-hero__social-link"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={ariaLabel}
        >
          <Icon />
        </a>
      ) : (
        <span key={href} className="portfolio-hero__social-link">
          <Icon />
        </span>
      )
    );

  const renderOverlayContent = (interactive: boolean) => (
    <>
      <div className="portfolio-hero__name-block portfolio-hero__parallax">
        <p className="portfolio-hero__name-line">Alpha</p>
        <p className="portfolio-hero__name-line">Sec</p>
      </div>

      <div className="portfolio-hero__nav-block portfolio-hero__parallax">
        <div className="portfolio-hero__nav-actions">
          {interactive ? (
            <Link
              className="portfolio-hero__nav-link portfolio-hero__nav-link--icon"
              to="/resume"
              aria-label="Duresa Kadi Resume"
              data-hover-label="Duresa Kadi Resume"
            >
              <ResumeIcon />
            </Link>
          ) : (
            <span
              className="portfolio-hero__nav-link portfolio-hero__nav-link--icon"
              aria-label="Duresa Kadi Resume"
              data-hover-label="Duresa Kadi Resume"
            >
              <ResumeIcon />
            </span>
          )}
          {interactive ? (
            session ? (
              <Link
                className="portfolio-hero__nav-link portfolio-hero__nav-link--icon"
                to="/map-loading"
                aria-label="Interactive Galaxy Map"
                data-hover-label="Interactive Galaxy Map"
              >
                <GalaxyMapIcon />
              </Link>
            ) : (
              <button
                className="portfolio-hero__nav-link portfolio-hero__nav-link--icon"
                onClick={() => setShowAuthModal(true)}
                aria-label="Interactive Galaxy Map"
                data-hover-label="Interactive Galaxy Map"
              >
                <GalaxyMapIcon />
              </button>
            )
          ) : (
            <span
              className="portfolio-hero__nav-link portfolio-hero__nav-link--icon"
              aria-label="Interactive Galaxy Map"
              data-hover-label="Interactive Galaxy Map"
            >
              <GalaxyMapIcon />
            </span>
          )}
        </div>
      </div>

      <div className="portfolio-hero__social-block portfolio-hero__parallax">{renderSocialLinks(interactive)}</div>
    </>
  );

  return (
    <section
      ref={heroRef}
      className={`portfolio-hero${prefersReducedMotion ? ' portfolio-hero--reduced-motion' : ''}`}
      aria-label="Portfolio homepage"
      style={{ '--portfolio-hero-bg-image': `url("${heroImageUrl}")` } as CSSProperties}
    >
      <div className="portfolio-hero__layer portfolio-hero__base-image" aria-hidden="true" />
      <div className="portfolio-hero__layer portfolio-hero__grid" aria-hidden="true" />
      <div
        className="portfolio-hero__layer portfolio-hero__alt-image portfolio-hero__spotlight-mask"
        aria-hidden="true"
      />

      <div className="portfolio-hero__content portfolio-hero__content--base">
        {renderOverlayContent(true)}
      </div>

      <div
        className="portfolio-hero__content portfolio-hero__content--invert portfolio-hero__spotlight-mask"
        aria-hidden="true"
      >
        {renderOverlayContent(false)}
      </div>

      <div className="portfolio-hero__cursor-layer" aria-hidden="true">
        {echoes.map((echo) => (
          <span
            key={echo.id}
            className="portfolio-hero__echo"
            style={{
              left: `${echo.x}px`,
              top: `${echo.y}px`,
              width: `${echo.size}px`,
              height: `${echo.size}px`,
              animationDuration: `${ECHO_LIFETIME_MS}ms`,
            }}
          />
        ))}
        <span className="portfolio-hero__cursor-ring" />
      </div>

      {/* Auth pill — top right */}
      <div
        style={{
          position: 'absolute',
          top: 'clamp(20px, 3.4vw, 48px)',
          right: 'clamp(20px, 3.4vw, 48px)',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        {session && profile ? (
          <>
            <span
              style={{
                fontFamily: '"Manrope", "Spline Sans", sans-serif',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#111',
              }}
            >
              {profile.display_name}
            </span>
            <button
              onClick={() => signOut()}
              className="portfolio-hero__auth-pill"
            >
              Sign Out
            </button>
          </>
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            className="portfolio-hero__auth-pill"
          >
            Sign In
          </button>
        )}
      </div>

      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </section>
  );
}
