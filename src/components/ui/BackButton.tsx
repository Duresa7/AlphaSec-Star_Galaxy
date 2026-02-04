import { useGalaxyStore } from '@/store/galaxyStore';

export function BackToGalaxyButton() {
  const { viewMode, setSelectedSystem, setInfoPanelData } = useGalaxyStore();
  
  // Only show when in system view
  if (viewMode !== 'system') {
    return null;
  }
  
  const handleClick = () => {
    setSelectedSystem(null);
    setInfoPanelData(null);
  };
  
  return (
    <button
      onClick={handleClick}
      className="
        fixed top-4 left-4 z-50
        flex items-center gap-2
        px-4 py-2
        bg-slate-900/90 hover:bg-slate-800/95
        border border-cyan-500/50 hover:border-cyan-400
        text-cyan-400 hover:text-cyan-300
        rounded-md
        font-medium tracking-wide
        transition-all duration-200
        backdrop-blur-sm
        shadow-lg shadow-cyan-500/10
        hover:shadow-cyan-400/20
      "
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
      GALAXY VIEW
    </button>
  );
}
