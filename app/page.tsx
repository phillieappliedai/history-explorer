'use client';

import { useEffect, useState } from 'react';
import AnimatedGlobe from '@/components/AnimatedGlobe_v2';
import TimelineControls from '@/components/TimelineControls';
import ChatInterface from '@/components/ChatInterface';
import { useAnimationStore, loadSequenceFromFile } from '@/lib/animationEngine';
import type { HistoricalEvent } from '@/lib/types';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const { sequence, loadSequence } = useAnimationStore();

  // Load the Khwarezm conquest animation on mount
  useEffect(() => {
    async function loadAnimation() {
      try {
        const animationSequence = await loadSequenceFromFile('/data/sequences/khwarezm-conquest.json');
        loadSequence(animationSequence);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load animation sequence:', error);
        setIsLoading(false);
      }
    }

    loadAnimation();
  }, [loadSequence]);

  // Handle events update from chat (legacy support)
  const handleEventsUpdate = (newEvents: HistoricalEvent[]) => {
    // For now, this is a no-op as we're focusing on the animation system
    console.log('Events update requested:', newEvents);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">History Explorer</h1>
            <p className="text-sm text-gray-400 mt-1">
              {sequence
                ? sequence.title
                : 'Interactive animated exploration of historical events'}
            </p>
          </div>
          {sequence && (
            <div className="text-right">
              <div className="text-xs text-gray-500">Time Period</div>
              <div className="text-lg font-bold text-white">
                {sequence.timeRange.start} - {sequence.timeRange.end}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Globe/Map */}
        <div className="flex-1 relative">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d2691e] mx-auto mb-4"></div>
                <p className="text-lg">Loading animation...</p>
              </div>
            </div>
          ) : (
            <AnimatedGlobe onMapLoad={() => console.log('Map loaded')} />
          )}

          {/* Instructions */}
          <div className="absolute top-4 left-4 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg p-4 max-w-sm">
            <div className="font-semibold text-white mb-2">Animation Controls</div>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Press Play to start the animation</li>
              <li>• Drag the slider to scrub through time</li>
              <li>• Drag the map to rotate view</li>
              <li>• Scroll to zoom in/out</li>
              <li>• Watch history unfold in real-time</li>
            </ul>
          </div>
        </div>

        {/* Chat Sidebar */}
        <div className="w-[400px] flex flex-col border-l border-gray-700">
          <ChatInterface onEventsUpdate={handleEventsUpdate} />
        </div>
      </div>

      {/* Timeline Controls at Bottom */}
      <TimelineControls />

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-700 px-6 py-3 text-center text-xs text-gray-500">
        <div className="flex items-center justify-center space-x-4">
          <span>Powered by Claude AI • deck.gl • Mapbox</span>
          <a
            href="https://github.com/phillieappliedai/history-explorer"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300"
          >
            View on GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
