import { useState } from 'react';
import { useGalaxyStore } from '@/store/galaxyStore';
import { timelineEvents } from '@/data/galaxyData';

export function TimelinePanel() {
  const { currentYear, setCurrentYear } = useGalaxyStore();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Sort events by year (descending - most recent first in BBY terms means lower number)
  const sortedEvents = [...timelineEvents].sort((a, b) => a.year - b.year);
  
  // Find current event
  const currentEvent = sortedEvents.find(e => e.year <= currentYear) || sortedEvents[sortedEvents.length - 1];
  
  // Timeline range
  const minYear = 3950;
  const maxYear = 5000;
  
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentYear(parseInt(e.target.value));
  };
  
  return (
    <div className="absolute bottom-4 left-4 right-4 max-w-4xl mx-auto">
      {/* Collapsed view */}
      <div 
        className="bg-black/80 border border-cyan-500/30 rounded-lg p-3 backdrop-blur-sm cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{currentYear}</div>
              <div className="text-xs text-gray-500">BBY</div>
            </div>
            
            {currentEvent && (
              <div className="border-l border-cyan-500/30 pl-4">
                <div className="text-sm font-bold text-cyan-400">{currentEvent.title}</div>
                <div className="text-xs text-gray-400">{currentEvent.description.substring(0, 60)}...</div>
              </div>
            )}
          </div>
          
          <button className="text-gray-400 hover:text-white transition-colors">
            <svg 
              className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>
        
        {/* Slider */}
        <div className="mt-3">
          <input
            type="range"
            min={minYear}
            max={maxYear}
            value={currentYear}
            onChange={handleSliderChange}
            onClick={(e) => e.stopPropagation()}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none
                       [&::-webkit-slider-thumb]:w-4
                       [&::-webkit-slider-thumb]:h-4
                       [&::-webkit-slider-thumb]:bg-cyan-400
                       [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:cursor-pointer
                       [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(0,191,255,0.5)]"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{maxYear} BBY</span>
            <span>Great Hyperspace War</span>
            <span>Mandalorian Wars</span>
            <span>Jedi Civil War</span>
            <span>{minYear} BBY</span>
          </div>
        </div>
      </div>
      
      {/* Expanded timeline */}
      {isExpanded && (
        <div className="mt-2 bg-black/90 border border-cyan-500/30 rounded-lg p-4 backdrop-blur-sm max-h-64 overflow-y-auto">
          <h3 className="text-sm font-bold text-cyan-400 mb-3">Historical Events</h3>
          
          <div className="space-y-3">
            {sortedEvents.map((event, index) => (
              <div 
                key={event.id}
                className={`flex gap-3 cursor-pointer transition-colors p-2 rounded ${
                  event.year === currentYear ? 'bg-cyan-500/20' : 'hover:bg-white/5'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentYear(event.year);
                }}
              >
                {/* Year marker */}
                <div className="flex-shrink-0 w-16 text-right">
                  <div className={`text-sm font-bold ${
                    event.year <= currentYear ? 'text-yellow-400' : 'text-gray-500'
                  }`}>
                    {event.year}
                  </div>
                  <div className="text-xs text-gray-600">BBY</div>
                </div>
                
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${
                    event.faction === 'sith_empire' ? 'bg-red-500' :
                    event.faction === 'galactic_republic' ? 'bg-yellow-400' :
                    'bg-gray-400'
                  }`} />
                  {index < sortedEvents.length - 1 && (
                    <div className="w-0.5 flex-1 bg-gray-700 mt-1" />
                  )}
                </div>
                
                {/* Event details */}
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-200">{event.title}</div>
                  <div className="text-xs text-gray-400">{event.description}</div>
                  {event.location && (
                    <div className="text-xs text-cyan-500 mt-1">
                      Location: {event.location}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
