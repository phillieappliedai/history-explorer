import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import weatherfordBook from '@/data/weatherford-genghis-khan.json';
import type { HistoricalEvent, ConversationMessage } from '@/lib/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// System prompt for historical research
const SYSTEM_PROMPT = `You are a historical research assistant for the History Explorer application. Your role is to help users explore historical events through conversation while maintaining strict factual accuracy.

CRITICAL RULES:
1. ONLY use facts from the provided tools - NEVER generate historical information from your training data
2. ALWAYS cite sources using the search_result format
3. If you don't have data on a topic, say "I don't have sourced information on..."
4. Acknowledge uncertainty in historical records explicitly
5. For interpretive questions (causation, "why"), present multiple scholarly views when they exist

AVAILABLE DATA:
- Events from "Genghis Khan and the Making of the Modern World" by Jack Weatherford (1162-1368)
- 34 curated events with full citations and book context
- Extended historical data via Wikidata (use cautiously, note it's from Wikidata)

When users ask questions like "What was happening in X when Y?":
1. Use temporal reasoning to identify the time period
2. Query appropriate tools
3. Present results with proper citations
4. Suggest follow-up questions

You have access to three specialized skills:
- wikidata-historical-queries: For expanding beyond core dataset
- temporal-reasoning: For handling date calculations and "when" questions
- historical-citations: For ensuring all claims are properly sourced`;

// Tool definitions
const tools: Anthropic.Tool[] = [
  {
    name: 'getCoreEvents',
    description: 'Get events from "Genghis Khan and the Making of the Modern World" by Jack Weatherford. Use this first before querying external sources. Can filter by year range, event type, or search term.',
    input_schema: {
      type: 'object',
      properties: {
        startYear: {
          type: 'number',
          description: 'Start year for filtering (e.g., 1206)'
        },
        endYear: {
          type: 'number',
          description: 'End year for filtering (e.g., 1294)'
        },
        eventType: {
          type: 'string',
          enum: ['conquest', 'battle', 'political', 'cultural', 'economic', 'founding'],
          description: 'Filter by event type'
        },
        searchTerm: {
          type: 'string',
          description: 'Search for events containing this term in name or description'
        }
      }
    }
  },
  {
    name: 'getEventDetails',
    description: 'Get full details for a specific event by ID, including all sources and metadata.',
    input_schema: {
      type: 'object',
      properties: {
        eventId: {
          type: 'string',
          description: 'The event ID (e.g., "battle-of-mohi-1241")'
        }
      },
      required: ['eventId']
    }
  },
  {
    name: 'getContemporaryEvents',
    description: 'Find what was happening in other regions during a specific time period. Useful for "What was happening in X when Y?" questions.',
    input_schema: {
      type: 'object',
      properties: {
        year: {
          type: 'number',
          description: 'The year to query around'
        },
        timeWindow: {
          type: 'number',
          description: 'How many years before/after to include (default: 2)',
          default: 2
        },
        region: {
          type: 'string',
          description: 'Specific region to focus on (optional)'
        }
      },
      required: ['year']
    }
  }
];

// Tool execution functions
function executeCoreEvents(params: any): HistoricalEvent[] {
  let filtered = weatherfordBook.events as HistoricalEvent[];

  if (params.startYear || params.endYear) {
    filtered = filtered.filter(event => {
      const eventYear = new Date(event.date).getFullYear();
      if (params.startYear && eventYear < params.startYear) return false;
      if (params.endYear && eventYear > params.endYear) return false;
      return true;
    });
  }

  if (params.eventType) {
    filtered = filtered.filter(event => event.type === params.eventType);
  }

  if (params.searchTerm) {
    const term = params.searchTerm.toLowerCase();
    filtered = filtered.filter(event =>
      event.name.toLowerCase().includes(term) ||
      event.description.toLowerCase().includes(term)
    );
  }

  return filtered;
}

function executeGetEventDetails(params: any): HistoricalEvent | null {
  const event = weatherfordBook.events.find((e: any) => e.id === params.eventId);
  return event as HistoricalEvent || null;
}

function executeGetContemporaryEvents(params: any): HistoricalEvent[] {
  const { year, timeWindow = 2 } = params;
  const startYear = year - timeWindow;
  const endYear = year + timeWindow;

  return weatherfordBook.events.filter((event: any) => {
    const eventYear = new Date(event.date).getFullYear();
    return eventYear >= startYear && eventYear <= endYear;
  }) as HistoricalEvent[];
}

// Format events as search_results for automatic citations
function formatAsSearchResults(events: HistoricalEvent[]): any[] {
  return events.map(event => ({
    type: 'document',
    document: {
      type: 'text',
      source: {
        type: 'url',
        url: event.sources[0]?.url || `https://en.wikipedia.org/wiki/${event.name.replace(/ /g, '_')}`
      },
      title: `${event.name} (${new Date(event.date).getFullYear()})`,
      text: `${event.name}

Date: ${event.date} (${event.dateUncertainty} precision)
Location: ${event.locationName}
Type: ${event.type}
${event.ruler ? `Ruler: ${event.ruler} Khan` : ''}

${event.description}

Significance: ${event.significance}

${event.casualties ? `Casualties: ${JSON.stringify(event.casualties)}` : ''}
${event.outcome ? `Outcome: ${event.outcome}` : ''}

Sources:
${event.sources.map(s => `- ${s.title}: ${s.url}`).join('\n')}`
    }
  }));
}

export async function POST(req: NextRequest) {
  try {
    const { query, conversationHistory = [] }: {
      query: string;
      conversationHistory: ConversationMessage[];
    } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Add user query to conversation
    const messages: Anthropic.MessageParam[] = [
      ...conversationHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      {
        role: 'user',
        content: query
      }
    ];

    // First Claude call: Determine which tools to use
    const initialResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages,
      tools,
    });

    // Execute tools
    let toolResults: any[] = [];
    if (initialResponse.stop_reason === 'tool_use') {
      for (const content of initialResponse.content) {
        if (content.type === 'tool_use') {
          let result: any;

          switch (content.name) {
            case 'getCoreEvents':
              result = executeCoreEvents(content.input);
              break;
            case 'getEventDetails':
              result = executeGetEventDetails(content.input);
              break;
            case 'getContemporaryEvents':
              result = executeGetContemporaryEvents(content.input);
              break;
            default:
              result = { error: 'Unknown tool' };
          }

          toolResults.push({
            type: 'tool_result',
            tool_use_id: content.id,
            content: JSON.stringify(result)
          });
        }
      }
    }

    // Second Claude call: Synthesize response with tool results
    const finalMessages: Anthropic.MessageParam[] = [
      ...messages,
      {
        role: 'assistant',
        content: initialResponse.content
      },
      {
        role: 'user',
        content: toolResults
      }
    ];

    const finalResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: finalMessages,
    });

    // Extract text response
    const textContent = finalResponse.content
      .filter((c): c is Anthropic.TextBlock => c.type === 'text')
      .map(c => c.text)
      .join('\n');

    // Parse tool results to extract events for visualization
    const events: HistoricalEvent[] = [];
    for (const result of toolResults) {
      try {
        const parsed = JSON.parse(result.content);
        if (Array.isArray(parsed)) {
          events.push(...parsed);
        } else if (parsed && typeof parsed === 'object') {
          events.push(parsed);
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }

    return NextResponse.json({
      answer: textContent,
      events: events.filter(e => e !== null),
      conversationHistory: [
        ...conversationHistory,
        { role: 'user', content: query },
        { role: 'assistant', content: textContent }
      ]
    });

  } catch (error: any) {
    console.error('Query error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
