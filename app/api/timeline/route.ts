import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// System prompt for timeline building
const SYSTEM_PROMPT = `You are a historical timeline builder. Your job is to help users build interactive timelines through conversation.

When users ask about historical events, you should:
1. Extract key events with dates, descriptions, and categories
2. Identify connections between events (causal, influential, concurrent, geographical)
3. For "find path" or "connect X to Y" queries, identify the shortest historical connection chain

Return your response in this JSON format:
{
  "answer": "Your conversational response to the user",
  "events": [
    {
      "id": "unique-id",
      "date": "YYYY-MM-DD",
      "year": 1234,
      "title": "Event name",
      "description": "Brief description",
      "category": "mongol" | "europe" | "china" | "middle_east" | "other",
      "source": "claude_added"
    }
  ],
  "connections": [
    {
      "from": "event-id-1",
      "to": "event-id-2",
      "type": "caused" | "influenced" | "concurrent" | "geographical",
      "strength": 0.0-1.0,
      "label": "brief explanation"
    }
  ],
  "highlightPath": ["event-id-1", "event-id-2", ...] // For path queries
}

Guidelines:
- Only include events directly relevant to the user's query
- Be selective - quality over quantity (3-5 events per query is ideal)
- Create connections when there's clear causal/influential relationships
- For "connect X to Y" queries, find the shortest logical path
- Use appropriate categories (mongol, europe, china, middle_east, other)
- Include year for temporal positioning

Special query types:
- "Tell me about X" → Return key events about X
- "What was happening in Y at that time?" → Return contemporary events
- "Connect X to Y" or "Find path from X to Y" → Return path with highlightPath
- "Show connections" → Emphasize connections field`;

const tools: Anthropic.Tool[] = [
  {
    name: 'add_timeline_events',
    description: 'Add events to the user\'s timeline with optional connections between them',
    input_schema: {
      type: 'object',
      properties: {
        events: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              date: { type: 'string', description: 'ISO date format YYYY-MM-DD' },
              year: { type: 'number' },
              title: { type: 'string' },
              description: { type: 'string' },
              category: {
                type: 'string',
                enum: ['mongol', 'europe', 'china', 'middle_east', 'other']
              },
              source: { type: 'string', enum: ['claude_added'] }
            },
            required: ['id', 'date', 'year', 'title', 'description', 'category', 'source']
          }
        },
        connections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              type: {
                type: 'string',
                enum: ['caused', 'influenced', 'concurrent', 'geographical']
              },
              strength: { type: 'number', minimum: 0, maximum: 1 },
              label: { type: 'string' }
            },
            required: ['from', 'to', 'type', 'strength']
          }
        },
        highlightPath: {
          type: 'array',
          items: { type: 'string' },
          description: 'Event IDs to highlight as a path (for "connect X to Y" queries)'
        }
      },
      required: ['events']
    }
  }
];

export async function POST(req: NextRequest) {
  try {
    const { query, conversationHistory = [] } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Build conversation
    const messages: Anthropic.MessageParam[] = [
      ...conversationHistory.map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      {
        role: 'user',
        content: query
      }
    ];

    // First call - determine what to add to timeline
    const initialResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages,
      tools,
    });

    // Extract tool use
    let timelineData: any = { events: [], connections: [], highlightPath: [] };
    let textResponse = '';

    for (const content of initialResponse.content) {
      if (content.type === 'text') {
        textResponse += content.text;
      } else if (content.type === 'tool_use' && content.name === 'add_timeline_events') {
        timelineData = content.input;
      }
    }

    // If no tool was used, make a second call with tool result to get the timeline data
    if (initialResponse.stop_reason === 'tool_use') {
      const toolResults = initialResponse.content
        .filter((c): c is Anthropic.ToolUseBlock => c.type === 'tool_use')
        .map(toolUse => ({
          type: 'tool_result' as const,
          tool_use_id: toolUse.id,
          content: JSON.stringify({ success: true })
        }));

      const finalResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [
          ...messages,
          {
            role: 'assistant',
            content: initialResponse.content
          },
          {
            role: 'user',
            content: toolResults
          }
        ],
      });

      // Extract final text response
      textResponse = finalResponse.content
        .filter((c): c is Anthropic.TextBlock => c.type === 'text')
        .map(c => c.text)
        .join('\n');
    }

    return NextResponse.json({
      answer: textResponse || 'Events added to timeline',
      events: timelineData.events || [],
      connections: timelineData.connections || [],
      highlightPath: timelineData.highlightPath || []
    });

  } catch (error: any) {
    console.error('Timeline API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
