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
        className="apple-card cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-semibold text-amber-400">{currentYear}</div>
              <div className="text-xs text-gray-500">BBY</div>
            </div>

            {currentEvent && (
              <div className="border-l border-white/10 pl-4">
                <div className="text-sm font-medium text-white">{currentEvent.title}</div>
                <div className="text-xs text-gray-400">{currentEvent.description.substring(0, 60)}...</div>
              </div>
            )}
          </div>

          <button className="apple-close-button">
            <svg
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>

        {/* Slider */}
        <div className="mt-4">
          <input
            type="range"
            min={minYear}
            max={maxYear}
            value={currentYear}
            onChange={handleSliderChange}
            onClick={(e) => e.stopPropagation()}
            className="apple-slider"
          />
          <div className="flex justify-between text-[10px] text-gray-500 mt-2">
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
        <div className="apple-card max-h-64 overflow-y-auto" style={{ marginTop: '12px' }}>
          <label className="section-label" style={{ marginBottom: '12px' }}>Historical Events</label>

          <div className="space-y-2 mt-3">
            {sortedEvents.map((event, index) => (
              <div
                key={event.id}
                className={`flex gap-3 cursor-pointer transition-colors p-3 rounded-lg ${
                  event.year === currentYear ? 'bg-cyan-500/10 border border-cyan-500/20' : 'hover:bg-white/5'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentYear(event.year);
                }}
              >
                {/* Year marker */}
                <div className="flex-shrink-0 w-14 text-right">
                  <div className={`text-sm font-semibold ${
                    event.year <= currentYear ? 'text-amber-400' : 'text-gray-500'
                  }`}>
                    {event.year}
                  </div>
                  <div className="text-[10px] text-gray-600">BBY</div>
                </div>

                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    event.faction === 'sith_empire' ? 'bg-red-500' :
                    event.faction === 'galactic_republic' ? 'bg-yellow-400' :
                    'bg-gray-400'
                  }`} />
                  {index < sortedEvents.length - 1 && (
                    <div className="w-px flex-1 bg-white/10 mt-1" />
                  )}
                </div>

                {/* Event details */}
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-200">{event.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{event.description}</div>
                  {event.location && (
                    <div className="text-xs text-cyan-400 mt-1">
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
