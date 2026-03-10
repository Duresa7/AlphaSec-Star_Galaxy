import { Link, useLocation } from "react-router-dom";
import { useRole } from "@/hooks/useRole";

const NAV_ITEMS = [
  { path: "/news", label: "Home" },
  { path: "/blog", label: "Blog" },
  { path: "/services", label: "AlphaSec Services" },
];

export function NewsShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { isBossman } = useRole();

  return (
    <main className="news-page" aria-label="AlphaSec News">
      <div
        className="news-page__layer news-page__layer--base"
        aria-hidden="true"
      />
      <div
        className="news-page__layer news-page__layer--veil"
        aria-hidden="true"
      />

      <div className="news-page__shell">
        <header className="news-nav" role="banner">
          <div className="news-nav__inner">
            <Link
              to="/"
              className="news-nav__icon-btn"
              aria-label="Back to home"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M19 12H5" />
                <path d="m12 5-7 7 7 7" />
              </svg>
            </Link>

            <Link to="/news" className="news-nav__logo">
              ALPHASEC UNITED
            </Link>

            <nav className="news-nav__links" aria-label="Main navigation">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  item.path === "/news"
                    ? pathname === "/news" ||
                      (pathname.startsWith("/news/") &&
                        !pathname.startsWith("/news/dashboard"))
                    : pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`news-nav__link${isActive ? " news-nav__link--active" : ""}`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              {isBossman && (
                <Link
                  to="/news/dashboard"
                  className={`news-nav__link${pathname === "/news/dashboard" ? " news-nav__link--active" : ""}`}
                >
                  Dashboard
                </Link>
              )}
            </nav>

            <div className="news-nav__actions">
              <button
                className="news-nav__icon-btn"
                aria-label="Search"
                type="button"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </button>
              <Link
                to="/settings"
                className="news-nav__icon-btn"
                aria-label="Profile"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </Link>
            </div>
          </div>
        </header>

        <div className="news-page__content">{children}</div>

        <footer className="news-footer">
          <div className="news-footer__inner">
            <div className="news-footer__top">
              <div className="news-footer__brand">
                <p className="news-footer__logo">AlphaSec United</p>
                <p className="news-footer__tagline">
                  Tech. Nonsense. Community.
                </p>
              </div>

              <div className="news-footer__columns">
                <div className="news-footer__column">
                  <h4 className="news-footer__column-title">Platform</h4>
                  <Link to="/news" className="news-footer__link">
                    News
                  </Link>
                  <Link to="/blog" className="news-footer__link">
                    Blog
                  </Link>
                  <Link to="/services" className="news-footer__link">
                    Services
                  </Link>
                </div>
                <div className="news-footer__column">
                  <h4 className="news-footer__column-title">Legal</h4>
                  <Link to="/privacy" className="news-footer__link">
                    Privacy Policy
                  </Link>
                  <Link to="/terms" className="news-footer__link">
                    Terms of Service
                  </Link>
                  <Link to="/credits" className="news-footer__link">
                    Credits
                  </Link>
                </div>
                <div className="news-footer__column">
                  <h4 className="news-footer__column-title">Connect</h4>
                  <div className="news-footer__social-icons">
                    <a
                      href="https://github.com/Duresa7"
                      className="news-footer__social-icon"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="GitHub profile"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <path
                          fill="currentColor"
                          d="M12 .5C5.65.5.5 5.67.5 12.05c0 5.11 3.3 9.44 7.88 10.97.58.1.8-.25.8-.56 0-.28-.02-1.2-.02-2.16-2.88.53-3.62-.7-3.84-1.34-.12-.33-.62-1.34-1.06-1.61-.36-.2-.86-.7-.01-.72.8-.02 1.38.73 1.57 1.03.91 1.53 2.36 1.09 2.94.83.09-.67.36-1.1.64-1.35-2.55-.29-5.21-1.28-5.21-5.67 0-1.25.44-2.28 1.17-3.09-.12-.29-.51-1.48.11-3.08 0 0 .95-.3 3.12 1.18a10.73 10.73 0 0 1 5.68 0c2.17-1.49 3.12-1.18 3.12-1.18.62 1.6.23 2.79.11 3.08.73.81 1.17 1.83 1.17 3.09 0 4.4-2.67 5.38-5.22 5.67.41.36.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.22.67.8.56a11.56 11.56 0 0 0 7.88-10.97C23.5 5.67 18.35.5 12 .5Z"
                        />
                      </svg>
                    </a>
                    <a
                      href="https://x.com/AlphaFLy_TV"
                      className="news-footer__social-icon"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="X profile"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <path
                          fill="currentColor"
                          d="M18.92 2H22l-6.73 7.7L23.2 22h-6.23l-4.87-7.03L5.95 22H2.87l7.2-8.23L.8 2h6.37l4.4 6.4L18.92 2Zm-1.09 18h1.73L6.22 3.88H4.37L17.83 20Z"
                        />
                      </svg>
                    </a>
                    <a
                      href="https://www.instagram.com/_bigdogd_/"
                      className="news-footer__social-icon"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram profile"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <path
                          fill="currentColor"
                          d="M7.5 2.5h9A5 5 0 0 1 21.5 7.5v9a5 5 0 0 1-5 5h-9a5 5 0 0 1-5-5v-9a5 5 0 0 1 5-5Zm9 1.5h-9A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4Zm-4.5 3.2a5.3 5.3 0 1 1 0 10.6 5.3 5.3 0 0 1 0-10.6Zm0 1.5a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Zm5.35-2.35a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3Z"
                        />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="news-footer__bottom">
              <p>
                &copy; {new Date().getFullYear()} AlphaSec United. All rights
                reserved.
              </p>
              <p>Made by Duresa Kadi</p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
