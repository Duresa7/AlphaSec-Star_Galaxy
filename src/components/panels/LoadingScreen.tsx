import { useGalaxyStore } from '@/store/galaxyStore';

export function LoadingScreen() {
  const { isLoading } = useGalaxyStore();

  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: 'var(--holo-void)' }}>

      <div className="text-center relative z-10">

        <div className="relative w-24 h-24 mx-auto mb-8">

          <div
            className="absolute inset-0 rounded-full"
            style={{
              border: '2px solid rgba(200, 170, 110, 0.2)',
              animation: 'diamondSpin 4s linear infinite',
            }}
          />

          <div
            className="absolute rounded-full"
            style={{
              inset: '8px',
              border: '2px solid rgba(0, 240, 255, 0.2)',
              animation: 'diamondSpin 3s linear infinite reverse',
            }}
          />

          <div
            className="absolute rounded-full"
            style={{
              inset: '16px',
              border: '2px solid rgba(200, 170, 110, 0.35)',
              animation: 'diamondSpin 2s linear infinite',
            }}
          />

          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-3 h-3 rounded-full animate-pulse"
              style={{
                backgroundColor: 'var(--holo-amber)',
                boxShadow: '0 0 16px rgba(200, 170, 110, 0.6)',
              }}
            />
          </div>
        </div>


        <h1
          className="text-2xl font-bold tracking-widest mb-3"
          style={{
            fontFamily: 'Orbitron, monospace',
            color: 'var(--holo-amber)',
            textShadow: '0 0 20px rgba(200, 170, 110, 0.4)',
          }}
        >
          GALAXY MAP
        </h1>


        <div className="w-48 h-px mx-auto mb-4 rounded-full overflow-hidden" style={{ background: 'rgba(200, 170, 110, 0.12)' }}>
          <div
            className="h-full rounded-full"
            style={{
              background: 'var(--holo-amber)',
              animation: 'holoBootLine 2s ease-in-out infinite',
              boxShadow: '0 0 8px rgba(200, 170, 110, 0.5)',
            }}
          />
        </div>

        <p
          className="text-sm mb-1"
          style={{
            fontFamily: 'Orbitron, monospace',
            fontSize: '10px',
            color: 'var(--holo-cyan)',
            textShadow: '0 0 10px rgba(0, 240, 255, 0.35)',
            letterSpacing: '0.2em',
            animation: 'holoPulse 2s ease-in-out infinite',
          }}
        >
          HOLONET UPLINK ESTABLISHED
        </p>
        <p
          className="text-xs mt-2"
          style={{
            fontFamily: '"Forum", Rajdhani, serif',
            color: 'var(--holo-text-muted)',
          }}
        >
          Initializing Navicomputer...
        </p>
        <p
          className="text-xs mt-3"
          style={{
            fontFamily: 'Orbitron, monospace',
            fontSize: '9px',
            color: 'var(--holo-amber)',
            opacity: 0.6,
            letterSpacing: '0.15em',
          }}
        >
          Old Republic Era ~ 3956 BBY
        </p>
      </div>
    </div>
  );
}
