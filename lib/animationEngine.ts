/**
 * Animation Engine
 * Manages timeline-based animation state for historical sequences
 * Uses Zustand for state management
 */

import { create } from 'zustand';
import type {
  AnimationSequence,
  AnimationState,
  AnimationActions,
  CityState,
  TerritoryFrame,
  NarrationSegment,
  CameraKeyframe
} from './types';

interface AnimationStore extends AnimationState, AnimationActions {}

export const useAnimationStore = create<AnimationStore>((set, get) => ({
  // Initial State
  isPlaying: false,
  currentTime: 0,
  speed: 1,
  sequence: null,
  currentYear: 0,
  visibleArmies: [],
  currentCityStates: new Map(),
  currentTerritoryGeometry: null,
  currentNarration: null,
  targetViewState: null,

  // Actions
  play: () => {
    set({ isPlaying: true });
    // Start animation loop
    const animate = () => {
      const state = get();
      if (!state.isPlaying || !state.sequence) return;

      const newTime = state.currentTime + (state.speed * 0.5); // Increment based on speed

      if (newTime >= 100) {
        // Animation complete
        set({ isPlaying: false, currentTime: 100 });
        return;
      }

      // Update current time and derived state
      get().seekTo(newTime);

      // Continue animation
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  },

  pause: () => {
    set({ isPlaying: false });
  },

  stop: () => {
    set({ isPlaying: false, currentTime: 0 });
    get().seekTo(0);
  },

  setSpeed: (speed: number) => {
    set({ speed });
  },

  seekTo: (timestamp: number) => {
    const state = get();
    const clampedTime = Math.max(0, Math.min(100, timestamp));

    if (!state.sequence) {
      set({ currentTime: clampedTime });
      return;
    }

    // Compute derived state based on timestamp
    const currentYear = interpolateYear(
      clampedTime,
      state.sequence.timeRange.start,
      state.sequence.timeRange.end
    );

    const currentCityStates = computeCityStates(state.sequence, clampedTime);
    const currentTerritoryGeometry = computeTerritoryGeometry(state.sequence, clampedTime);
    const currentNarration = getNarrationAtTime(state.sequence, clampedTime);
    const targetViewState = getTargetViewState(state.sequence, clampedTime);

    set({
      currentTime: clampedTime,
      currentYear,
      currentCityStates,
      currentTerritoryGeometry,
      currentNarration,
      targetViewState
    });
  },

  skipToYear: (year: number) => {
    const state = get();
    if (!state.sequence) return;

    const { start, end } = state.sequence.timeRange;
    const timestamp = ((year - start) / (end - start)) * 100;
    get().seekTo(timestamp);
  },

  loadSequence: (sequence: AnimationSequence) => {
    set({
      sequence,
      currentTime: 0,
      isPlaying: false,
      visibleArmies: sequence.armies,
      currentYear: sequence.timeRange.start
    });
    // Initialize derived state
    get().seekTo(0);
  },

  unloadSequence: () => {
    set({
      sequence: null,
      currentTime: 0,
      isPlaying: false,
      visibleArmies: [],
      currentCityStates: new Map(),
      currentTerritoryGeometry: null,
      currentNarration: null,
      targetViewState: null,
      currentYear: 0
    });
  },

  getCurrentYear: () => get().currentYear,

  getNarrationAtTime: (timestamp: number) => {
    const state = get();
    if (!state.sequence) return null;
    return getNarrationAtTime(state.sequence, timestamp);
  }
}));

// ============================================================================
// Helper Functions
// ============================================================================

function interpolateYear(timestamp: number, startYear: number, endYear: number): number {
  return Math.round(startYear + ((endYear - startYear) * (timestamp / 100)));
}

function computeCityStates(
  sequence: AnimationSequence,
  currentTime: number
): Map<string, CityState> {
  const states = new Map<string, CityState>();

  for (const city of sequence.cities) {
    // Find the most recent event that has occurred by currentTime
    let currentState: CityState = 'neutral';

    for (const event of city.events) {
      if (event.timestamp <= currentTime) {
        currentState = event.state;
      } else {
        break; // Events should be sorted by timestamp
      }
    }

    states.set(city.id, currentState);
  }

  return states;
}

function computeTerritoryGeometry(
  sequence: AnimationSequence,
  currentTime: number
): TerritoryFrame | null {
  if (!sequence.territories || sequence.territories.length === 0) {
    return null;
  }

  const territory = sequence.territories[0]; // For now, handle single territory

  // Find the most recent frame that has occurred
  let currentFrame: TerritoryFrame | null = null;

  for (const frame of territory.frames) {
    if (frame.timestamp <= currentTime) {
      currentFrame = frame;
    } else {
      break; // Frames should be sorted by timestamp
    }
  }

  return currentFrame;
}

function getNarrationAtTime(
  sequence: AnimationSequence,
  currentTime: number
): NarrationSegment | null {
  // Find the most recent narration segment
  let currentNarration: NarrationSegment | null = null;

  for (const narration of sequence.narration) {
    if (narration.timestamp <= currentTime) {
      currentNarration = narration;
    } else {
      break;
    }
  }

  return currentNarration;
}

function getTargetViewState(
  sequence: AnimationSequence,
  currentTime: number
): CameraKeyframe['viewState'] | null {
  if (!sequence.cameraKeyframes || sequence.cameraKeyframes.length === 0) {
    return null;
  }

  // Find the keyframe we should be transitioning to
  for (let i = 0; i < sequence.cameraKeyframes.length; i++) {
    const keyframe = sequence.cameraKeyframes[i];

    if (currentTime < keyframe.timestamp) {
      // We're between previous keyframe and this one
      if (i === 0) {
        return keyframe.viewState;
      }

      const prevKeyframe = sequence.cameraKeyframes[i - 1];
      const progress = (currentTime - prevKeyframe.timestamp) / (keyframe.timestamp - prevKeyframe.timestamp);

      // Linear interpolation between keyframes
      return interpolateViewState(prevKeyframe.viewState, keyframe.viewState, progress);
    }
  }

  // We're past all keyframes, return the last one
  return sequence.cameraKeyframes[sequence.cameraKeyframes.length - 1].viewState;
}

function interpolateViewState(
  from: CameraKeyframe['viewState'],
  to: CameraKeyframe['viewState'],
  progress: number
): CameraKeyframe['viewState'] {
  return {
    longitude: from.longitude + (to.longitude - from.longitude) * progress,
    latitude: from.latitude + (to.latitude - from.latitude) * progress,
    zoom: from.zoom + (to.zoom - from.zoom) * progress,
    pitch: (from.pitch ?? 0) + ((to.pitch ?? 0) - (from.pitch ?? 0)) * progress,
    bearing: (from.bearing ?? 0) + ((to.bearing ?? 0) - (from.bearing ?? 0)) * progress
  };
}

// ============================================================================
// Utility Exports
// ============================================================================

/**
 * Load an animation sequence from JSON
 */
export async function loadSequenceFromFile(filepath: string): Promise<AnimationSequence> {
  const response = await fetch(filepath);
  if (!response.ok) {
    throw new Error(`Failed to load sequence: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Normalize a year to a 0-100 timestamp within a sequence's time range
 */
export function yearToTimestamp(year: number, start: number, end: number): number {
  return ((year - start) / (end - start)) * 100;
}

/**
 * Convert a 0-100 timestamp to a year within a sequence's time range
 */
export function timestampToYear(timestamp: number, start: number, end: number): number {
  return start + ((end - start) * (timestamp / 100));
}
