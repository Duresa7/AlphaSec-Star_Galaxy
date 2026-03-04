import { LegalShell } from '@/components/legal/LegalShell';
import { LEGAL_CONTACT_EMAIL, LEGAL_ENTITY_NAME, LEGAL_LAST_UPDATED } from '@/constants/legal';

export function TermsPage() {
  return (
    <LegalShell ariaLabel="Terms of Service">
      <h1 className="legal-page__title">Terms of Service</h1>
      <p className="legal-page__updated">Last updated: {LEGAL_LAST_UPDATED}</p>

      <section className="legal-page__section">
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using this web application (&quot;the
          Application&quot;), operated by {LEGAL_ENTITY_NAME} (&quot;we,&quot; &quot;us,&quot;
          or &quot;our&quot;), you agree to be bound by these Terms of Service. If you
          do not agree to these terms, do not use the Application.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>2. Description of Service</h2>
        <p>
          The Application is an interactive web-based galaxy map that allows
          users to explore star systems, planets, and fleets. Authorized administrators
          may create, modify, and manage custom content.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>3. User Accounts</h2>
        <p>
          To access certain features, you must create an account. You are responsible for:
        </p>
        <ul>
          <li>Maintaining the confidentiality of your account credentials</li>
          <li>All activity that occurs under your account</li>
          <li>Providing accurate and current information</li>
          <li>Notifying us immediately of any unauthorized use of your account</li>
        </ul>
        <p>
          We reserve the right to suspend or terminate accounts that violate these
          terms or that we reasonably believe pose a security risk.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>4. User Responsibilities</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Application for any unlawful purpose</li>
          <li>Attempt to gain unauthorized access to any part of the Application</li>
          <li>Interfere with or disrupt the Application or its servers</li>
          <li>Upload malicious content, spam, or inappropriate material</li>
          <li>Impersonate any person or entity</li>
          <li>Circumvent or disable any security features of the Application</li>
          <li>Scrape, crawl, or use automated means to access the Application without permission</li>
        </ul>
      </section>

      <section className="legal-page__section">
        <h2>5. Intellectual Property</h2>
        <p>
          The Application&apos;s source code, design, user interface, and original
          content are the property of {LEGAL_ENTITY_NAME} and are protected by applicable
          intellectual property laws.
        </p>
        <p>
          User-generated content (custom planets, fleets, and map modifications)
          remains the intellectual property of the user who created it, with a
          non-exclusive license granted to us to display it within the Application.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>6. Limitation of Liability</h2>
        <p>
          The Application is provided &quot;as is&quot; and &quot;as available&quot;
          without warranties of any kind, either express or implied, including but
          not limited to implied warranties of merchantability, fitness for a
          particular purpose, and non-infringement.
        </p>
        <p>
          To the fullest extent permitted by law, {LEGAL_ENTITY_NAME} shall not be liable for
          any indirect, incidental, special, consequential, or punitive damages,
          including but not limited to loss of data, loss of profits, or business
          interruption, arising out of or in connection with your use of the
          Application.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>7. Indemnification</h2>
        <p>
          You agree to indemnify and hold harmless {LEGAL_ENTITY_NAME} from any claims,
          damages, losses, or expenses arising from your use of the Application
          or violation of these terms.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>8. Governing Law</h2>
        <p>
          These Terms of Service shall be governed by and construed in accordance
          with the laws of the United States. Any disputes arising under these terms
          shall be subject to the exclusive jurisdiction of the courts in the
          applicable jurisdiction.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>9. Dispute Resolution</h2>
        <p>
          Any dispute arising from these Terms of Service or your use of the
          Application shall first be attempted to be resolved through good-faith
          negotiation. If a resolution cannot be reached within 30 days, either
          party may pursue legal remedies available under applicable law.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>10. Termination</h2>
        <p>
          We may terminate or suspend your access to the Application at any time,
          with or without cause, with or without notice. Upon termination, your
          right to use the Application will immediately cease.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>11. Changes to These Terms</h2>
        <p>
          We reserve the right to modify these Terms of Service at any time. Changes
          will be effective upon posting to this page with an updated &quot;Last
          updated&quot; date. Your continued use of the Application after changes
          constitutes acceptance of the modified terms.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>12. Contact Information</h2>
        <p>
          If you have questions about these Terms of Service, please contact us:
        </p>
        <ul>
          <li><strong>Entity:</strong> {LEGAL_ENTITY_NAME}</li>
          <li><strong>Email:</strong>{' '}
            <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>
          </li>
        </ul>
      </section>
    </LegalShell>
  );
}
