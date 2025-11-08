'use client';

import { useEffect, useState } from 'react';
import ChatInterface from '@/components/ChatInterface';
import HistoricalGlobe from '@/components/HistoricalGlobe';
import type { HistoricalEvent } from '@/lib/types';
import weatherfordBook from '@/data/weatherford-genghis-khan.json';

export default function Home() {
  const [events, setEvents] = useState<HistoricalEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load Weatherford book events on mount
  useEffect(() => {
    try {
      setEvents(weatherfordBook.events as HistoricalEvent[]);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load events:', error);
      setIsLoading(false);
    }
  }, []);

  // Handle events update from chat
  const handleEventsUpdate = (newEvents: HistoricalEvent[]) => {
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
              <span className="font-semibold text-gray-300">{weatherfordBook.book.title}</span> by {weatherfordBook.book.author}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {weatherfordBook.book.description}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Book Published</div>
            <div className="text-lg font-bold text-white">{weatherfordBook.book.published}</div>
            <div className="text-xs text-gray-500 mt-2">Events</div>
            <div className="text-lg font-bold text-[#d2691e]">{events.length} mapped</div>
          </div>
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
                <p className="text-lg">Loading timeline...</p>
              </div>
            </div>
          ) : (
            <HistoricalGlobe
              events={events}
              currentYear={1368}
            />
          )}

          {/* Instructions */}
          <div className="absolute top-4 left-4 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg p-4 max-w-md">
            <div className="font-semibold text-white mb-2">📚 Book Timeline View</div>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• <span className="text-[#d2691e] font-semibold">{events.length} events</span> from Weatherford's book</li>
              <li>• Rotate the globe to explore geographically</li>
              <li>• Hover over events to see details</li>
              <li>• Click events to learn more</li>
              <li>• Use chat to ask questions about the book</li>
            </ul>
            <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-400">
              Timeline: 1162 (Genghis Khan's birth) - 1368 (Fall of Yuan Dynasty)
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        <div className="w-[400px] flex flex-col border-l border-gray-700">
          <ChatInterface onEventsUpdate={handleEventsUpdate} />
        </div>
      </div>

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
