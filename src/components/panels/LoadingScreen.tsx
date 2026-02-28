import { useGalaxyDataStore } from '@/store/galaxyDataStore';

export function LoadingScreen() {
  const isLoading = useGalaxyDataStore((s) => s.isLoading);

  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: 'var(--holo-void)' }}>
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(200, 170, 110, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(200, 170, 110, 0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="text-center relative z-10">

        <div className="relative w-28 h-28 mx-auto mb-8">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              border: '1px solid rgba(200, 170, 110, 0.15)',
              animation: 'diamondSpin 6s linear infinite',
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              inset: '6px',
              border: '1px solid rgba(200, 170, 110, 0.1)',
              animation: 'diamondSpin 4s linear infinite reverse',
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              inset: '14px',
              border: '2px solid rgba(200, 170, 110, 0.2)',
              animation: 'diamondSpin 2.5s linear infinite',
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              inset: '22px',
              border: '1px solid rgba(200, 170, 110, 0.1)',
              animation: 'diamondSpin 3s linear infinite reverse',
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: 'var(--holo-amber)',
                animation: 'holoPulse 2s ease-in-out infinite',
              }}
            />
          </div>
        </div>

        <h1
          className="text-2xl font-bold tracking-[0.3em] mb-2"
          style={{
            fontFamily: 'Orbitron, monospace',
            color: 'var(--holo-amber)',
          }}
        >
          GALAXY MAP
        </h1>
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="h-px w-16" style={{ background: 'linear-gradient(90deg, transparent, rgba(200, 170, 110, 0.3))' }} />
          <div className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--holo-amber)', opacity: 0.5 }} />
          <div className="h-px w-16" style={{ background: 'linear-gradient(90deg, rgba(200, 170, 110, 0.3), transparent)' }} />
        </div>
        <div className="w-52 h-[2px] mx-auto mb-4 rounded-full overflow-hidden" style={{ background: 'rgba(200, 170, 110, 0.1)' }}>
          <div
            className="h-full rounded-full"
            style={{
              background: 'var(--holo-amber)',
              animation: 'holoBootLine 2.5s ease-in-out infinite',
            }}
          />
        </div>

        <p
          className="text-sm mb-1"
          style={{
            fontFamily: 'Oxanium, Orbitron, monospace',
            fontSize: '12px',
            color: 'var(--holo-amber)',
            letterSpacing: '0.2em',
            opacity: 0.7,
            animation: 'holoPulse 2s ease-in-out infinite',
          }}
        >
          HOLONET UPLINK ESTABLISHED
        </p>
        <p
          className="text-xs mt-2"
          style={{
            fontFamily: '"Spline Sans", Manrope, sans-serif',
            fontSize: '13px',
            color: 'var(--holo-text-muted)',
          }}
        >
          Initializing Navicomputer...
        </p>
        <p
          className="text-xs mt-3"
          style={{
            fontFamily: 'Oxanium, Orbitron, monospace',
            fontSize: '11px',
            color: 'var(--holo-amber)',
            opacity: 0.4,
            letterSpacing: '0.12em',
          }}
        >
          Old Republic Era &middot; 3956 BBY
        </p>
      </div>
    </div>
  );
}
