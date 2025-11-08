'use client';

import { useEffect, useRef, useState } from 'react';

interface TimelineEvent {
  id: string;
  date: string;
  year: number;
  title: string;
  description: string;
  category: string;
  source: 'user_query' | 'claude_added';
}

interface EventConnection {
  from: string;
  to: string;
  type: 'caused' | 'influenced' | 'concurrent' | 'geographical';
  strength: number;
  label?: string;
}

interface ConversationalTimelineProps {
  events: TimelineEvent[];
  connections: EventConnection[];
  highlightPath?: string[]; // Event IDs to highlight as a path
}

export default function ConversationalTimeline({
  events,
  connections,
  highlightPath = []
}: ConversationalTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);

  // Sort events by year
  const sortedEvents = [...events].sort((a, b) => a.year - b.year);

  // Get year range
  const minYear = sortedEvents.length > 0 ? sortedEvents[0].year : 1200;
  const maxYear = sortedEvents.length > 0 ? sortedEvents[sortedEvents.length - 1].year : 1400;
  const yearRange = maxYear - minYear || 100;

  // Calculate position for each event (0-100%)
  const getEventPosition = (year: number) => {
    return ((year - minYear) / yearRange) * 100;
  };

  // Category colors
  const categoryColors: Record<string, string> = {
    mongol: '#d2691e',
    europe: '#4169e1',
    china: '#dc143c',
    middle_east: '#9370db',
    default: '#888'
  };

  const getEventColor = (category: string) => {
    return categoryColors[category] || categoryColors.default;
  };

  // Get connected events
  const getConnectedEvents = (eventId: string) => {
    return connections
      .filter(c => c.from === eventId || c.to === eventId)
      .map(c => c.from === eventId ? c.to : c.from);
  };

  return (
    <div className="w-full h-full bg-gray-950 overflow-auto" ref={containerRef}>
      <div className="min-w-full p-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Historical Timeline</h2>
          <p className="text-gray-400 text-sm">
            {events.length} events • {minYear} - {maxYear}
          </p>
        </div>

        {/* Timeline Container */}
        <div className="relative" style={{ minHeight: '400px' }}>
          {/* Timeline axis */}
          <div className="absolute left-0 right-0 top-32 h-1 bg-gray-700" />

          {/* Year markers */}
          <div className="absolute left-0 right-0 top-28">
            {Array.from({ length: 5 }, (_, i) => {
              const year = minYear + (yearRange / 4) * i;
              const pos = getEventPosition(year);
              return (
                <div
                  key={i}
                  className="absolute text-xs text-gray-500"
                  style={{ left: `${pos}%`, transform: 'translateX(-50%)' }}
                >
                  {Math.round(year)}
                </div>
              );
            })}
          </div>

          {/* Events */}
          {sortedEvents.map((event, index) => {
            const pos = getEventPosition(event.year);
            const isHighlighted = highlightPath.includes(event.id);
            const isHovered = hoveredEvent === event.id;
            const connectedEvents = getConnectedEvents(event.id);
            const showConnections = isHovered || isHighlighted;

            // Alternate above/below timeline
            const isAbove = index % 2 === 0;

            return (
              <div key={event.id}>
                {/* Event marker */}
                <div
                  className={`absolute ${isAbove ? 'top-20' : 'top-44'} transition-all duration-200 cursor-pointer`}
                  style={{
                    left: `${pos}%`,
                    transform: 'translateX(-50%)',
                  }}
                  onMouseEnter={() => setHoveredEvent(event.id)}
                  onMouseLeave={() => setHoveredEvent(null)}
                >
                  {/* Line to timeline */}
                  <div
                    className={`absolute left-1/2 ${isAbove ? 'top-full' : 'bottom-full'} w-0.5 ${
                      isHighlighted ? 'bg-yellow-400' : 'bg-gray-600'
                    }`}
                    style={{ height: '20px' }}
                  />

                  {/* Event card */}
                  <div
                    className={`w-48 p-3 rounded-lg border-2 transition-all ${
                      isHighlighted
                        ? 'border-yellow-400 bg-yellow-900/30 scale-110'
                        : isHovered
                        ? 'border-white bg-gray-800 scale-105'
                        : 'border-gray-600 bg-gray-900'
                    }`}
                    style={{
                      borderLeftColor: getEventColor(event.category),
                      borderLeftWidth: '4px',
                    }}
                  >
                    <div className="text-xs text-gray-400 mb-1">{event.year}</div>
                    <div className="text-sm font-semibold text-white mb-1 line-clamp-2">
                      {event.title}
                    </div>
                    <div className="text-xs text-gray-300 line-clamp-2">
                      {event.description}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: getEventColor(event.category),
                          color: 'white',
                        }}
                      >
                        {event.category}
                      </span>
                      {event.source === 'claude_added' && (
                        <span className="text-xs text-blue-400">✨ Added by Claude</span>
                      )}
                    </div>
                  </div>

                  {/* Dot on timeline */}
                  <div
                    className={`absolute left-1/2 ${isAbove ? 'top-[calc(100%+20px)]' : 'bottom-[calc(100%+20px)]'} -translate-x-1/2 w-3 h-3 rounded-full ${
                      isHighlighted
                        ? 'bg-yellow-400 ring-4 ring-yellow-400/30'
                        : 'bg-gray-300'
                    }`}
                    style={{
                      backgroundColor: isHighlighted
                        ? '#fbbf24'
                        : getEventColor(event.category),
                    }}
                  />
                </div>

                {/* Connection lines (SVG overlay) */}
                {showConnections &&
                  connectedEvents.map(targetId => {
                    const targetEvent = sortedEvents.find(e => e.id === targetId);
                    if (!targetEvent) return null;

                    const connection = connections.find(
                      c =>
                        (c.from === event.id && c.to === targetId) ||
                        (c.to === event.id && c.from === targetId)
                    );

                    const targetPos = getEventPosition(targetEvent.year);
                    const isPathConnection =
                      highlightPath.includes(event.id) &&
                      highlightPath.includes(targetId);

                    return (
                      <svg
                        key={`${event.id}-${targetId}`}
                        className="absolute top-0 left-0 w-full h-full pointer-events-none"
                        style={{ zIndex: isPathConnection ? 10 : 1 }}
                      >
                        <line
                          x1={`${pos}%`}
                          y1="132"
                          x2={`${targetPos}%`}
                          y2="132"
                          stroke={isPathConnection ? '#fbbf24' : '#4b5563'}
                          strokeWidth={isPathConnection ? 3 : 1.5}
                          strokeDasharray={connection?.type === 'influenced' ? '5,5' : '0'}
                          opacity={isPathConnection ? 1 : 0.5}
                        />
                        {connection?.label && isPathConnection && (
                          <text
                            x={`${(pos + targetPos) / 2}%`}
                            y="128"
                            fill="#fbbf24"
                            fontSize="10"
                            textAnchor="middle"
                          >
                            {connection.label}
                          </text>
                        )}
                      </svg>
                    );
                  })}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-16 flex gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#d2691e]" />
            <span>Mongol Empire</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#4169e1]" />
            <span>Europe</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#dc143c]" />
            <span>China</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#9370db]" />
            <span>Middle East</span>
          </div>
          <div className="ml-8 flex items-center gap-2">
            <div className="w-8 h-0.5 bg-gray-600" />
            <span>Causal connection</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-gray-600" style={{ strokeDasharray: '3,3' }} />
            <span>Influenced by</span>
          </div>
        </div>

        {/* Empty state */}
        {events.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg mb-2">No events yet</p>
            <p className="text-sm">
              Ask Claude about historical events to start building your timeline
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
