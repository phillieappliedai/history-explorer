'use client';

import { useState } from 'react';
import ChatInterface from '@/components/ChatInterface';
import ConversationalTimeline from '@/components/ConversationalTimeline';

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

export default function Home() {
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [connections, setConnections] = useState<EventConnection[]>([]);
  const [highlightPath, setHighlightPath] = useState<string[]>([]);

  // Handle timeline updates from chat
  const handleTimelineUpdate = (data: any) => {
    if (data.events) {
      setTimelineEvents(prev => [...prev, ...data.events]);
    }
    if (data.connections) {
      setConnections(prev => [...prev, ...data.connections]);
    }
    if (data.highlightPath) {
      setHighlightPath(data.highlightPath);
    }
  };

  return (
    <div className="flex h-screen bg-gray-950">
      {/* Chat Sidebar - LEFT */}
      <div className="w-[400px] flex flex-col border-r border-gray-700">
        <div className="bg-gray-900 border-b border-gray-700 px-4 py-3">
          <h2 className="text-lg font-bold text-white">💬 Conversation</h2>
          <p className="text-xs text-gray-400 mt-1">
            Ask about history and build your timeline
          </p>
        </div>
        <ChatInterface onEventsUpdate={handleTimelineUpdate} />
      </div>

      {/* Timeline - RIGHT (main area) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-gray-900 border-b border-gray-700 px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">📊 Historical Timeline</h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Build your timeline through conversation • Find connections between events
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Events on Timeline</div>
              <div className="text-2xl font-bold text-[#d2691e]">{timelineEvents.length}</div>
            </div>
          </div>
        </header>

        {/* Timeline View */}
        <div className="flex-1 overflow-hidden">
          <ConversationalTimeline
            events={timelineEvents}
            connections={connections}
            highlightPath={highlightPath}
          />
        </div>

        {/* Instructions overlay (shows when empty) */}
        {timelineEvents.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg p-8 max-w-lg pointer-events-auto">
              <h3 className="text-2xl font-bold text-white mb-4">🚀 Welcome to History Explorer!</h3>
              <p className="text-gray-300 mb-4">
                Build an interactive timeline by asking Claude about historical events.
              </p>
              <div className="space-y-3 text-sm text-gray-400">
                <p className="flex items-start gap-2">
                  <span className="text-[#d2691e] font-bold">1.</span>
                  <span>Ask about any historical event: <span className="text-white">"Tell me about Genghis Khan"</span></span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-[#d2691e] font-bold">2.</span>
                  <span>Explore connections: <span className="text-white">"What was happening in Europe?"</span></span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-[#d2691e] font-bold">3.</span>
                  <span>Find paths: <span className="text-white">"Connect Genghis Khan to the Black Death"</span></span>
                </p>
              </div>
              <div className="mt-6 p-3 bg-blue-900/30 border border-blue-700 rounded text-xs text-blue-200">
                💡 <span className="font-semibold">Pro tip:</span> Events appear as you chat. Hover to see connections!
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
