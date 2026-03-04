import { LegalShell } from '@/components/legal/LegalShell';

export function CreditsPage() {
  return (
    <LegalShell ariaLabel="3D Model Credits">
      <h1 className="legal-page__title">3D Model Credits</h1>
      <p className="legal-page__updated">
        The following third-party 3D models are used in this application under Creative Commons
        Attribution licenses. We gratefully credit their creators below.
      </p>

      <section className="legal-page__section">
        <h2>Models</h2>

        <h3>Star Wars Republic Frigate</h3>
        <ul>
          <li><strong>Author:</strong> iedalton</li>
          <li>
            <strong>Source:</strong>{' '}
            <a href="https://skfb.ly/6RNL6" target="_blank" rel="noopener noreferrer">
              https://skfb.ly/6RNL6
            </a>
          </li>
          <li>
            <strong>License:</strong>{' '}
            <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">
              Creative Commons Attribution 4.0 (CC BY 4.0)
            </a>
          </li>
          <li><strong>Changes:</strong> None</li>
        </ul>

        <h3>Harrower Class Dreadnought</h3>
        <ul>
          <li><strong>Author:</strong> Kuat-Entralla 3D Engineering</li>
          <li>
            <strong>Source:</strong>{' '}
            <a href="https://skfb.ly/6YW6I" target="_blank" rel="noopener noreferrer">
              https://skfb.ly/6YW6I
            </a>
          </li>
          <li>
            <strong>License:</strong>{' '}
            <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">
              Creative Commons Attribution 4.0 (CC BY 4.0)
            </a>
          </li>
          <li><strong>Changes:</strong> None</li>
        </ul>

        <h3>Valor-class Cruiser</h3>
        <ul>
          <li><strong>Author:</strong> Gargi (Thingiverse)</li>
          <li>
            <strong>Source:</strong>{' '}
            <a href="https://cults3d.com/en/3d-model/game/star-wars-the-old-republic-valor-class" target="_blank" rel="noopener noreferrer">
              cults3d.com
            </a>
          </li>
          <li>
            <strong>License:</strong>{' '}
            <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">
              Creative Commons Attribution (CC BY)
            </a>
          </li>
          <li><strong>Changes:</strong> Modified for use in this application</li>
        </ul>

        <h3>Terminus-class Destroyer</h3>
        <ul>
          <li><strong>Author:</strong> OmegaNova (Thingiverse)</li>
          <li>
            <strong>Source:</strong>{' '}
            <a href="https://www.thingiverse.com/thing:1949904" target="_blank" rel="noopener noreferrer">
              thingiverse.com
            </a>
          </li>
          <li>
            <strong>License:</strong>{' '}
            <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">
              Creative Commons Attribution (CC BY)
            </a>
          </li>
          <li><strong>Changes:</strong> Modified for use in this application</li>
        </ul>
      </section>
    </LegalShell>
  );
}
