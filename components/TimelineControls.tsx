'use client';

import { useEffect, useState } from 'react';
import { useAnimationStore } from '@/lib/animationEngine';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

export default function TimelineControls() {
  const {
    sequence,
    isPlaying,
    currentTime,
    speed,
    currentYear,
    currentNarration,
    play,
    pause,
    stop,
    setSpeed,
    seekTo
  } = useAnimationStore();

  const [isDragging, setIsDragging] = useState(false);

  if (!sequence) {
    return (
      <div className="w-full bg-gray-900 border-t border-gray-700 p-4 text-center text-gray-500">
        No animation sequence loaded
      </div>
    );
  }

  const { start, end } = sequence.timeRange;
  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const handleStop = () => {
    stop();
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    seekTo(value);
  };

  const handleSliderMouseDown = () => {
    setIsDragging(true);
    if (isPlaying) {
      pause();
    }
  };

  const handleSliderMouseUp = () => {
    setIsDragging(false);
  };

  const skipBackward = () => {
    seekTo(Math.max(0, currentTime - 10));
  };

  const skipForward = () => {
    seekTo(Math.min(100, currentTime + 10));
  };

  return (
    <div className="w-full bg-gray-900 border-t border-gray-700">
      {/* Narration Display */}
      {currentNarration && (
        <div className="px-6 py-3 bg-gray-800/50 border-b border-gray-700">
          <p className="text-sm text-gray-300 leading-relaxed">
            {currentNarration.text}
          </p>
          {currentNarration.citationUrls && currentNarration.citationUrls.length > 0 && (
            <div className="mt-2 flex gap-2">
              {currentNarration.citationUrls.map((url, idx) => (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 underline"
                >
                  Source {idx + 1}
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="px-6 py-4">
        {/* Timeline Scrubber */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">
              {start}
            </span>
            <span className="text-sm font-semibold text-white">
              Year: {currentYear}
            </span>
            <span className="text-xs text-gray-400">
              {end}
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={currentTime}
            onChange={handleSliderChange}
            onMouseDown={handleSliderMouseDown}
            onMouseUp={handleSliderMouseUp}
            onTouchStart={handleSliderMouseDown}
            onTouchEnd={handleSliderMouseUp}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-4
                     [&::-webkit-slider-thumb]:h-4
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-[#d2691e]
                     [&::-webkit-slider-thumb]:cursor-pointer
                     [&::-webkit-slider-thumb]:hover:bg-[#ff8c42]
                     [&::-moz-range-thumb]:w-4
                     [&::-moz-range-thumb]:h-4
                     [&::-moz-range-thumb]:rounded-full
                     [&::-moz-range-thumb]:bg-[#d2691e]
                     [&::-moz-range-thumb]:cursor-pointer
                     [&::-moz-range-thumb]:hover:bg-[#ff8c42]
                     [&::-moz-range-thumb]:border-0"
          />

          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-500">
              {currentTime.toFixed(1)}%
            </span>
            <span className="text-xs text-gray-500">
              {sequence.timeRange.durationMonths} months compressed
            </span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Stop */}
            <button
              onClick={handleStop}
              className="p-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
              title="Stop and reset"
            >
              <SkipBack size={18} />
            </button>

            {/* Skip Backward */}
            <button
              onClick={skipBackward}
              className="p-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
              title="Skip backward 10%"
            >
              <SkipBack size={18} />
            </button>

            {/* Play/Pause */}
            <button
              onClick={handlePlayPause}
              className="p-3 rounded-lg bg-[#d2691e] hover:bg-[#ff8c42] text-white transition-colors"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>

            {/* Skip Forward */}
            <button
              onClick={skipForward}
              className="p-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
              title="Skip forward 10%"
            >
              <SkipForward size={18} />
            </button>
          </div>

          {/* Speed Control */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Speed:</span>
            {[0.5, 1, 2].map((speedOption) => (
              <button
                key={speedOption}
                onClick={() => handleSpeedChange(speedOption)}
                className={`px-3 py-1 rounded text-xs transition-colors ${
                  speed === speedOption
                    ? 'bg-[#d2691e] text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {speedOption}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
