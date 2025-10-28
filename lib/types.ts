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
