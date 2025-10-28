'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { HistoricalEvent } from '@/lib/types';

// Dynamically import Globe to avoid SSR issues
const Globe = dynamic(() => import('react-globe.gl'), { ssr: false });

interface HistoricalGlobeProps {
  events: HistoricalEvent[];
  currentYear?: number;
  focusEvent?: string | null;
}

export default function HistoricalGlobe({
  events,
  currentYear = 1206,
  focusEvent = null
}: HistoricalGlobeProps) {
  const globeEl = useRef<any>();
  const [globeReady, setGlobeReady] = useState(false);

  // Filter events by current year
  const visibleEvents = events.filter(event => {
    const eventYear = new Date(event.date).getFullYear();
    return Math.abs(eventYear) <= Math.abs(currentYear);
  });

  // Focus on specific event when selected
  useEffect(() => {
    if (globeReady && focusEvent && globeEl.current) {
      const event = events.find(e => e.id === focusEvent);
      if (event) {
        globeEl.current.pointOfView(
          {
            lat: event.location.lat,
            lng: event.location.lng,
            altitude: 1.5
          },
          1000 // animation duration
        );
      }
    }
  }, [focusEvent, events, globeReady]);

  // Initialize globe position
  useEffect(() => {
    if (globeReady && globeEl.current) {
      // Start centered on Mongolia
      globeEl.current.pointOfView({ lat: 46.86, lng: 103.85, altitude: 2 }, 0);
    }
  }, [globeReady]);

  return (
    <div className="w-full h-full">
      <Globe
        ref={globeEl}
        onGlobeReady={() => setGlobeReady(true)}

        // Globe appearance
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"

        // Points (events)
        pointsData={visibleEvents}
        pointLat={(d: any) => d.location.lat}
        pointLng={(d: any) => d.location.lng}
        pointAltitude={0.01}
        pointRadius={(d: any) => {
          // Larger radius for more significant events
          return d.narrative_confidence ? d.narrative_confidence * 0.5 : 0.3;
        }}
        pointColor={(d: any) => {
          // Color by event type
          const colors: Record<string, string> = {
            conquest: '#d2691e',
            battle: '#ff4444',
            political: '#4169e1',
            cultural: '#9370db',
            economic: '#ffa500',
            founding: '#8b4513'
          };
          return colors[d.type] || '#ffffff';
        }}
        pointLabel={(d: any) => {
          const event = d as HistoricalEvent;
          return `
            <div style="background: rgba(0,0,0,0.8); padding: 12px; border-radius: 8px; max-width: 300px;">
              <div style="color: #fff; font-weight: bold; margin-bottom: 4px;">
                ${event.name}
              </div>
              <div style="color: #aaa; font-size: 0.9em; margin-bottom: 8px;">
                ${new Date(event.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: event.dateUncertainty === 'exact' ? 'numeric' : undefined
                })}
                ${event.dateUncertainty !== 'exact' ? ` (${event.dateUncertainty} precision)` : ''}
              </div>
              <div style="color: #ccc; font-size: 0.85em;">
                ${event.description.substring(0, 150)}${event.description.length > 150 ? '...' : ''}
              </div>
              <div style="color: #888; font-size: 0.75em; margin-top: 8px;">
                Click for full details
              </div>
            </div>
          `;
        }}

        // Interaction
        onPointClick={(point: any) => {
          const event = point as HistoricalEvent;
          // Dispatch custom event for parent to handle
          window.dispatchEvent(new CustomEvent('eventSelected', {
            detail: event
          }));
        }}

        // Animation
        enablePointerInteraction={true}
      />
    </div>
  );
}
