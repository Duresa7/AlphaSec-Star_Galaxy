import { useGalaxyDataStore } from '@/store/galaxyDataStore';

export function LoadingScreen() {
  const isLoading = useGalaxyDataStore((s) => s.isLoading);

  if (!isLoading) return null;

  return (
    <section
      className="map-loading-overlay"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading galaxy map"
    >
      <div className="map-loading-overlay__layer map-loading-overlay__layer--void" aria-hidden="true" />
      <div className="map-loading-overlay__layer map-loading-overlay__layer--stars" aria-hidden="true" />
      <div className="map-loading-overlay__layer map-loading-overlay__layer--grid" aria-hidden="true" />
      <div className="map-loading-overlay__layer map-loading-overlay__layer--sweep" aria-hidden="true" />

      <div className="map-loading-overlay__frame">
        <div className="map-loading-overlay__corner map-loading-overlay__corner--tl" aria-hidden="true" />
        <div className="map-loading-overlay__corner map-loading-overlay__corner--tr" aria-hidden="true" />
        <div className="map-loading-overlay__corner map-loading-overlay__corner--bl" aria-hidden="true" />
        <div className="map-loading-overlay__corner map-loading-overlay__corner--br" aria-hidden="true" />

        <div className="map-loading-overlay__core" aria-hidden="true">
          <span className="map-loading-overlay__core-ring map-loading-overlay__core-ring--outer" />
          <span className="map-loading-overlay__core-ring map-loading-overlay__core-ring--middle" />
          <span className="map-loading-overlay__core-ring map-loading-overlay__core-ring--inner" />
          <span className="map-loading-overlay__core-ring map-loading-overlay__core-ring--arc" />
          <span className="map-loading-overlay__core-dot" />
        </div>

        <h1 className="map-loading-overlay__title">GALAXY MAP</h1>

        <div className="map-loading-overlay__signal" aria-hidden="true">
          <span className="map-loading-overlay__signal-line" />
          <span className="map-loading-overlay__signal-pip" />
          <span className="map-loading-overlay__signal-pip map-loading-overlay__signal-pip--offset" />
          <span className="map-loading-overlay__signal-line map-loading-overlay__signal-line--reverse" />
        </div>

        <div className="map-loading-overlay__progress" aria-hidden="true">
          <span />
          <span />
        </div>

        <p className="map-loading-overlay__status">HOLONET UPLINK ESTABLISHED</p>
        <p className="map-loading-overlay__copy">Initializing Navicomputer...</p>
        <p className="map-loading-overlay__meta">Old Republic Era &middot; 3956 ATC</p>
      </div>
    </section>
  );
}
