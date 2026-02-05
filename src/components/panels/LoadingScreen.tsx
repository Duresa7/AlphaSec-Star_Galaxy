import { useGalaxyStore } from '@/store/galaxyStore';

export function LoadingScreen() {
  const { isLoading } = useGalaxyStore();

  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black">
      <div className="text-center">
        {/* Animated logo/spinner */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          {/* Outer ring */}
          <div
            className="absolute inset-0 border-2 border-cyan-500/20 rounded-full animate-spin"
            style={{ animationDuration: '3s' }}
          />
          {/* Middle ring */}
          <div
            className="absolute inset-2 border-2 border-amber-500/30 rounded-full animate-spin"
            style={{ animationDuration: '2s', animationDirection: 'reverse' }}
          />
          {/* Inner ring */}
          <div
            className="absolute inset-4 border-2 border-red-500/40 rounded-full animate-spin"
            style={{ animationDuration: '1.5s' }}
          />
          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
          </div>
        </div>

        {/* Text */}
        <h1 className="text-2xl font-bold text-white tracking-widest mb-3">
          STAR WARS
        </h1>
        <p className="text-gray-500 text-sm">
          Loading Galaxy Map...
        </p>
        <p className="text-amber-400/70 text-xs mt-3">
          Old Republic Era ~ 3956 BBY
        </p>
      </div>
    </div>
  );
}
