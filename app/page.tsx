'use client';

import { useState } from 'react';
import HistoricalGlobe from '@/components/HistoricalGlobe';
import ChatInterface from '@/components/ChatInterface';
import mongolEventsData from '@/data/mongol-events.json';
import type { HistoricalEvent } from '@/lib/types';

export default function Home() {
  const [events, setEvents] = useState<HistoricalEvent[]>(
    mongolEventsData.events as HistoricalEvent[]
  );
  const [currentYear, setCurrentYear] = useState(1206);
  const [focusEvent, setFocusEvent] = useState<string | null>(null);

  // Handle events update from chat
  const handleEventsUpdate = (newEvents: HistoricalEvent[]) => {
    // Merge new events with existing, avoiding duplicates
    const eventIds = new Set(events.map(e => e.id));
    const uniqueNew = newEvents.filter(e => !eventIds.has(e.id));
    if (uniqueNew.length > 0) {
      setEvents([...events, ...uniqueNew]);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">History Explorer</h1>
            <p className="text-sm text-gray-400 mt-1">
              Interactive exploration of the Mongol Empire (1206-1294)
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-xs text-gray-500">Viewing Year</div>
              <div className="text-lg font-bold text-white">{currentYear}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Globe */}
        <div className="flex-1 relative">
          <HistoricalGlobe
            events={events}
            currentYear={currentYear}
            focusEvent={focusEvent}
          />

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg p-4 text-sm">
            <div className="font-semibold text-white mb-2">Event Types</div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-[#d2691e]"></div>
                <span className="text-gray-300">Conquest</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-[#ff4444]"></div>
                <span className="text-gray-300">Battle</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-[#4169e1]"></div>
                <span className="text-gray-300">Political</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-[#9370db]"></div>
                <span className="text-gray-300">Cultural</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-[#ffa500]"></div>
                <span className="text-gray-300">Economic</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-[#8b4513]"></div>
                <span className="text-gray-300">Founding</span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="absolute top-4 left-4 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg p-4 max-w-sm">
            <div className="font-semibold text-white mb-2">Getting Started</div>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Drag to rotate the globe</li>
              <li>• Scroll to zoom in/out</li>
              <li>• Hover over events for details</li>
              <li>• Ask questions in the chat →</li>
            </ul>
          </div>
        </div>

        {/* Chat Sidebar */}
        <div className="w-[400px] flex flex-col">
          <ChatInterface onEventsUpdate={handleEventsUpdate} />
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-700 px-6 py-3 text-center text-xs text-gray-500">
        <div className="flex items-center justify-center space-x-4">
          <span>Powered by Claude AI • All facts cited and verified</span>
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
