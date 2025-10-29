/**
 * Core TypeScript types for the History Explorer
 * Based on research-backed architecture for fact-based AI systems
 */

export type DateUncertainty = 'exact' | 'month' | 'year' | 'circa' | 'period';

export type EventType =
  | 'conquest'
  | 'battle'
  | 'founding'
  | 'political'
  | 'cultural'
  | 'economic';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Source {
  type: 'wikipedia' | 'wikidata' | 'academic' | 'curated';
  url: string;
  title: string;
  accessed?: string;
  notes?: string;
}

export interface HistoricalEvent {
  id: string;
  name: string;
  type: EventType;
  date: string; // ISO 8601 format (e.g., "1220-03-15")
  dateUncertainty: DateUncertainty;
  location: Coordinates;
  locationName: string;
  description: string;
  significance: string;

  // Narrative markers (from user's CLAUDE.md context)
  is_narrative: boolean;
  narrative_type?: string;
  narrative_confidence?: number;

  // Attribution - CRITICAL for preventing hallucinations
  sources: Source[];

  // Optional details
  casualties?: {
    mongols?: number;
    opponents?: number;
  };
  opponents?: string[];
  outcome?: string;
  ruler?: 'Genghis' | 'Ögedei' | 'Güyük' | 'Möngke' | 'Kublai';
}

export interface Territory {
  id: string;
  name: string;
  year: number;
  empire: string;
  // GeoJSON-like structure for globe visualization
  geometry: {
    type: 'Polygon';
    coordinates: number[][][]; // [[[lng, lat], [lng, lat], ...]]
  };
  population?: number;
  significance: string;
  sources: Source[];
}

export interface TradeRoute {
  id: string;
  name: string;
  startYear: number;
  endYear: number;
  path: Coordinates[];
  goods: string[];
  significance: string;
  sources: Source[];
}

// Claude API types
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface QueryResponse {
  answer: string;
  events: HistoricalEvent[];
  visualizationCommands: VisualizationCommand[];
  sources: Source[];
  followUpQuestions: string[];
}

export interface VisualizationCommand {
  type: 'focusLocation' | 'showEvents' | 'animateExpansion' | 'highlightRegion';
  data: any;
}

// Wikidata SPARQL types
export interface WikidataEvent {
  id: string;
  label: string;
  date: string;
  coordinates?: Coordinates;
  description: string;
  wikidataId: string;
}

// Tool schemas for Claude API
export interface ToolCall {
  name: string;
  parameters: Record<string, any>;
}

// ============================================================================
// Animation Sequence Types (for deck.gl animated timeline)
// ============================================================================

export type CityState = 'neutral' | 'under_siege' | 'conquered' | 'allied' | 'mongol_capital';

export interface ArmyPath {
  id: string;
  name: string;
  commander?: string;
  troopCount: number; // Total troops in this army
  composition: {     // Breakdown by unit type
    cavalry: number;
    infantry: number;
    siege: number;
  };
  path: [number, number][]; // [lng, lat] pairs
  timestamps: number[]; // Relative timestamps (0-100)
  style: {
    color: string;
    width: number;
  };
}

export interface CityEvent {
  timestamp: number; // 0-100 relative timeline
  state: CityState;
  iconSize: number;
  label?: string;
}

export interface AnimatedCity {
  id: string;
  name: string;
  location: [number, number]; // [lng, lat]
  events: CityEvent[];
}

export interface TerritoryFrame {
  timestamp: number; // 0-100
  geometry: {
    type: 'Polygon';
    coordinates: number[][][]; // [[[lng, lat], ...]]
  };
  fillColor: [number, number, number, number]; // RGBA
  lineColor: [number, number, number, number]; // RGBA
}

export interface AnimatedTerritory {
  id: string;
  name: string;
  frames: TerritoryFrame[];
}

export interface CameraKeyframe {
  timestamp: number; // 0-100
  viewState: {
    longitude: number;
    latitude: number;
    zoom: number;
    pitch?: number;
    bearing?: number;
  };
  duration: number; // ms for transition
  label?: string;
}

export interface NarrationSegment {
  timestamp: number; // 0-100
  speaker: 'narrator' | 'user' | 'claude';
  text: string;
  citationUrls?: string[];
}

export interface AnimationSequence {
  id: string;
  title: string;
  description: string;
  timeRange: {
    start: number; // Year (e.g., 1219)
    end: number; // Year (e.g., 1221)
    durationMonths?: number;
  };
  armies: ArmyPath[];
  cities: AnimatedCity[];
  territories: AnimatedTerritory[];
  cameraKeyframes: CameraKeyframe[];
  narration: NarrationSegment[];
  metadata?: {
    historicalAccuracy?: 'high' | 'medium' | 'low' | 'speculative';
    sources?: string[];
    notes?: string[];
    createdDate?: string;
    version?: string;
  };
}

// Animation Engine State
export interface AnimationState {
  // Playback control
  isPlaying: boolean;
  currentTime: number; // 0-100
  speed: number; // 0.5x, 1x, 2x, etc.

  // Current sequence
  sequence: AnimationSequence | null;

  // Derived state (computed from currentTime)
  currentYear: number; // Interpolated year
  visibleArmies: ArmyPath[];
  currentCityStates: Map<string, CityState>;
  currentTerritoryGeometry: TerritoryFrame | null;
  currentNarration: NarrationSegment | null;

  // Camera
  targetViewState: CameraKeyframe['viewState'] | null;
}

// Animation Control Actions
export interface AnimationActions {
  // Playback
  play: () => void;
  pause: () => void;
  stop: () => void;
  setSpeed: (speed: number) => void;
  seekTo: (timestamp: number) => void;
  skipToYear: (year: number) => void;

  // Sequence management
  loadSequence: (sequence: AnimationSequence) => void;
  unloadSequence: () => void;

  // Utilities
  getCurrentYear: () => number;
  getNarrationAtTime: (timestamp: number) => NarrationSegment | null;
}
