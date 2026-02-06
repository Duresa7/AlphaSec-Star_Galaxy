import { useGalaxyStore } from '@/store/galaxyStore';

export function LoadingScreen() {
  const { isLoading } = useGalaxyStore();

  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: 'var(--holo-void)' }}>
      {/* Scan-line overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(200, 170, 110, 0.03) 2px, rgba(200, 170, 110, 0.03) 4px)',
        }}
      />

      <div className="text-center relative z-10" style={{ animation: 'holoFlicker 4s infinite' }}>
        {/* Diamond spinner */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          {/* Outer diamond */}
          <div
            className="absolute inset-0"
            style={{
              border: '2px solid rgba(200, 170, 110, 0.3)',
              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
              animation: 'diamondSpin 4s linear infinite',
            }}
          />
          {/* Middle diamond */}
          <div
            className="absolute"
            style={{
              inset: '8px',
              border: '2px solid rgba(0, 240, 255, 0.3)',
              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
              animation: 'diamondSpin 3s linear infinite reverse',
            }}
          />
          {/* Inner diamond */}
          <div
            className="absolute"
            style={{
              inset: '16px',
              border: '2px solid rgba(200, 170, 110, 0.5)',
              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
              animation: 'diamondSpin 2s linear infinite',
            }}
          />
          {/* Center diamond dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-3 h-3 animate-pulse"
              style={{
                backgroundColor: 'var(--holo-amber)',
                clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                boxShadow: '0 0 12px rgba(200, 170, 110, 0.6)',
              }}
            />
          </div>
        </div>

        {/* Boot text */}
        <h1
          className="text-2xl font-bold tracking-widest mb-3"
          style={{
            fontFamily: 'Orbitron, monospace',
            color: 'var(--holo-amber)',
            textShadow: '0 0 15px rgba(200, 170, 110, 0.5), 0 0 30px rgba(200, 170, 110, 0.2)',
          }}
        >
          STAR WARS
        </h1>

        {/* Boot line animation */}
        <div className="w-48 h-px mx-auto mb-4" style={{ background: 'rgba(200, 170, 110, 0.15)' }}>
          <div
            className="h-full"
            style={{
              background: 'var(--holo-amber)',
              animation: 'holoBootLine 2s ease-in-out infinite',
              boxShadow: '0 0 6px rgba(200, 170, 110, 0.5)',
            }}
          />
        </div>

        <p
          className="text-sm mb-1"
          style={{
            fontFamily: 'Orbitron, monospace',
            fontSize: '10px',
            color: 'var(--holo-cyan)',
            textShadow: '0 0 8px rgba(0, 240, 255, 0.4)',
            letterSpacing: '0.2em',
            animation: 'holoPulse 2s ease-in-out infinite',
          }}
        >
          HOLONET UPLINK ESTABLISHED
        </p>
        <p
          className="text-xs mt-2"
          style={{
            fontFamily: 'Rajdhani, sans-serif',
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
