import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { Footer } from '@/components/Footer';

export function PrivacyPolicyPage() {
  const heroImageUrl = `${import.meta.env.BASE_URL}homepage-bg.jpg`;

  return (
    <main
      className="legal-shell"
      aria-label="Privacy Policy"
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
          <h1 className="legal-page__title">Privacy Policy</h1>
          <p className="legal-page__updated">Last updated: February 10, 2026</p>

          <section className="legal-page__section">
            <h2>1. Introduction</h2>
            <p>
              Alpha Sec (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates this
              web application. This Privacy Policy explains what
              information we collect, how we use it, and your rights regarding that information.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>2. Information We Collect</h2>
            <h3>Account Information</h3>
            <p>
              When you create an account, we collect your <strong>email address</strong> and
              a <strong>display name</strong> you provide. Account authentication is handled
              by Supabase.
            </p>
            <h3>Automatically Collected Information</h3>
            <p>
              When you visit our application, our hosting provider may automatically log
              your <strong>IP address</strong>, <strong>browser type</strong>, <strong>operating
              system</strong>, and <strong>access timestamps</strong>. These server logs are
              standard and used for security monitoring and abuse prevention.
            </p>
            <h3>User-Generated Content</h3>
            <p>
              If you are an authorized user (admin), any custom planets, fleets, or map
              modifications you create are stored in our database along with your user ID
              for attribution and audit purposes.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>3. How We Use Your Information</h2>
            <ul>
              <li>To create and manage your account</li>
              <li>To authenticate you and enforce role-based access controls</li>
              <li>To display your display name within the application</li>
              <li>To maintain audit logs of administrative actions</li>
              <li>To protect the application from abuse and unauthorized access</li>
            </ul>
          </section>

          <section className="legal-page__section">
            <h2>4. Third-Party Services</h2>
            <p>We use the following third-party service:</p>
            <ul>
              <li>
                <strong>Supabase</strong> &mdash; provides authentication, database storage,
                and row-level security for our application. Supabase processes your email
                address and account data on our behalf. See the{' '}
                <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">
                  Supabase Privacy Policy
                </a>.
              </li>
            </ul>
            <p>
              We do not sell, rent, or share your personal information with any other third
              parties for marketing or advertising purposes.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>5. Data Storage and Security</h2>
            <p>
              Your data is stored in a Supabase-hosted PostgreSQL database with row-level
              security (RLS) policies that restrict data access based on your authenticated
              role. We use industry-standard encryption for data in transit (TLS/SSL).
            </p>
            <p>
              While we take reasonable measures to protect your information, no method of
              electronic storage is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>6. Data Retention and Deletion</h2>
            <p>
              We retain your account data for as long as your account is active. You may
              request deletion of your account and all associated data by contacting us
              at{' '}
              <a href="mailto:alphasecunited@gmail.com">alphasecunited@gmail.com</a>. We will
              process deletion requests within 30 days.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>7. Your Rights</h2>
            <h3>All Users</h3>
            <ul>
              <li>Access your personal data we hold</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Withdraw consent for data processing</li>
            </ul>
            <h3>California Residents (CCPA / CPRA)</h3>
            <p>
              If you are a California resident, you have additional rights under the
              California Consumer Privacy Act (CCPA) and the California Privacy Rights
              Act (CPRA), including the right to know what personal information we collect,
              the right to request deletion, and the right to opt out of the sale of
              personal information. We do not sell personal information.
            </p>
            <h3>Colorado, Virginia, and Other U.S. State Laws</h3>
            <p>
              Residents of states with comprehensive privacy laws (including Colorado,
              Virginia, Connecticut, Utah, and others) may have similar rights to access,
              delete, and correct personal data. Contact us to exercise these rights.
            </p>
            <h3>Canadian Residents (PIPEDA)</h3>
            <p>
              If you are a Canadian resident, the Personal Information Protection and
              Electronic Documents Act (PIPEDA) grants you the right to access and
              challenge the accuracy of your personal information held by us. You may
              also withdraw consent for the collection, use, or disclosure of your
              personal information.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>8. Cookies and Tracking</h2>
            <p>
              Our application uses <strong>essential cookies only</strong> for authentication
              session management (provided by Supabase Auth). These cookies are strictly
              necessary for the application to function and cannot be disabled.
            </p>
            <p>
              We do not use advertising cookies, analytics tracking pixels (such as
              Google Analytics or Facebook Pixel), or any other non-essential tracking
              technologies.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>9. Email Communications (CAN-SPAM / CASL)</h2>
            <p>
              We may send you transactional emails related to your account (e.g., password
              reset). We comply with the U.S. CAN-SPAM Act and Canadian Anti-Spam
              Legislation (CASL):
            </p>
            <ul>
              <li>We will not use misleading subject lines</li>
              <li>We will identify messages as advertisements when applicable</li>
              <li>We will include our contact information in all emails</li>
              <li>We will honor opt-out/unsubscribe requests within 10 business days</li>
            </ul>
          </section>

          <section className="legal-page__section">
            <h2>10. Children&apos;s Privacy</h2>
            <p>
              Our application is not intended for children under 13 years of age. We do
              not knowingly collect personal information from children under 13. If you
              believe we have collected information from a child under 13, please contact
              us immediately.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of
              any material changes by posting the new policy on this page with an updated
              &quot;Last updated&quot; date.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>12. Contact Information</h2>
            <p>
              If you have questions about this Privacy Policy or wish to exercise your
              privacy rights, please contact us:
            </p>
            <ul>
              <li><strong>Entity:</strong> Alpha Sec</li>
              <li><strong>Email:</strong>{' '}
                <a href="mailto:alphasecunited@gmail.com">alphasecunited@gmail.com</a>
              </li>
            </ul>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
