import { useGalaxyStore } from '@/store/galaxyStore';

export function BackToGalaxyButton() {
  const { viewMode, setSelectedSystem, setSelectedFleet, setInfoPanelData } = useGalaxyStore();

  // Only show when not in top-down view
  if (viewMode === 'topdown') {
    return null;
  }

  const handleClick = () => {
    setSelectedSystem(null);
    setSelectedFleet(null);
    setInfoPanelData(null);
  };

  return (
    <button
      onClick={handleClick}
      className="
        fixed top-4 left-4 z-50
        flex items-center gap-2
        px-4 py-2.5
        apple-card
        text-gray-300 hover:text-white
        font-medium text-sm
        animate-fade-in
        transition-colors
      "
      style={{ padding: '10px 16px' }}
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 19l-7-7 7-7"
        />
      </svg>
      <span className="text-xs font-medium">Return to Galaxy</span>
    </button>
  );
}
