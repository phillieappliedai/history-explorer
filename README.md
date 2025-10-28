# History Explorer 🌍

Interactive 3D globe for exploring historical events through natural language queries powered by Claude AI.

![History Explorer](https://img.shields.io/badge/status-alpha-orange) ![Next.js](https://img.shields.io/badge/Next.js-14-black) ![Claude](https://img.shields.io/badge/Claude-Sonnet%204.5-blue)

## What is This?

**History Explorer** lets you explore history by asking questions in natural language. A 3D globe visualizes events as you discover them through conversation with Claude AI.

### The Experience

1. **Ask**: "Show me how Genghis Khan conquered the world"
2. **See**: Globe animates the Mongol Empire spreading across Asia and Europe
3. **Explore**: "What was happening in Europe in 1241?"
4. **Discover**: Claude shows you the Battle of Legnica and Battle of Mohi with full citations

**Key Features:**
- 🌍 Interactive 3D globe with 20 curated Mongol Empire events (1206-1294)
- 💬 Natural language queries powered by Claude Sonnet 4.5
- 📚 Zero hallucinations - every fact cited with Wikipedia sources
- 🎓 Educational tool with explicit uncertainty markers
- 🚀 Architecture scales to all of human history

## Quick Start

### Prerequisites

- Node.js 18+
- Anthropic API key ([get one here](https://console.anthropic.com/))

### Installation

```bash
# Clone the repository
git clone https://github.com/phillieappliedai/history-explorer.git
cd history-explorer

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your ANTHROPIC_API_KEY

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

### Architecture: Tool-Based AI with Claude Skills

History Explorer uses **Approach 2 (Scalable Hybrid)** from our architectural research:

```
User Query → Claude (Router) → Tools → Verified Database → Claude (Synthesizer) → Cited Response
```

**Key principles:**
1. ✅ Claude NEVER generates historical facts from training data
2. ✅ All facts retrieved from database with `search_result` format
3. ✅ Automatic citations using Claude's Citations API
4. ✅ Claude explicitly says "I don't have data on X" when appropriate
5. ✅ Sequential tool calling (no parameter guessing)

### Claude Skills (Progressive Disclosure)

We use Claude's new Skills feature for efficient knowledge loading:

- **`wikidata-historical-queries`** (~30 tokens standby): SPARQL templates for expanding data on demand
- **`temporal-reasoning`** (~30 tokens standby): Date handling, uncertainty, comparative timelines
- **`historical-citations`** (~30 tokens standby): Anti-hallucination citation framework

Skills load only when needed, keeping token usage low while providing deep expertise.

### Data Strategy

**Hybrid approach:**
- **20 manually curated events** (1206-1294) with Wikipedia citations - highest quality
- **Wikidata SPARQL** integration ready for expanding to thousands more events
- **Progressive loading**: Show essentials first, expand as user explores

Every event includes:
- Date with uncertainty level (exact/month/year/circa/period)
- Geospatial coordinates
- Source attribution (Wikipedia URLs)
- Narrative confidence markers
- Full historical context

## Project Structure

```
history-explorer/
├── app/
│   ├── api/query/         # Claude API endpoint with tool-based queries
│   ├── page.tsx           # Main application page
│   └── layout.tsx         # Root layout
├── components/
│   ├── HistoricalGlobe.tsx   # 3D globe visualization
│   └── ChatInterface.tsx     # Chat UI with conversation memory
├── data/
│   └── mongol-events.json    # 20 curated events with citations
├── lib/
│   └── types.ts              # TypeScript type definitions
└── skills/
    ├── wikidata-historical-queries/
    ├── temporal-reasoning/
    └── historical-citations/
```

## Example Queries

Try asking:

- **"Show me Genghis Khan's major conquests"** - See territorial expansion
- **"What was happening in Europe in 1241?"** - Discover contemporaneous events
- **"Explain the Battle of Mohi"** - Get detailed event information
- **"How did the Mongol Empire expand so quickly?"** - Analytical questions
- **"What happened after Genghis Khan died?"** - Historical succession

All answers include citations you can verify!

## Technology Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **3D Visualization**: react-globe.gl (WebGL-based)
- **AI**: Claude Sonnet 4.5 via Anthropic API
- **State Management**: Zustand (planned)
- **Animations**: Framer Motion (planned)

## Development Roadmap

### ✅ Completed (Phase 1)
- [x] Project architecture and research
- [x] 20 curated Mongol events with full citations
- [x] 3 Claude Skills for progressive knowledge disclosure
- [x] TypeScript types and data structures
- [x] 3D globe visualization with react-globe.gl
- [x] Claude API integration with tool-based queries
- [x] Chat interface with conversation memory

### 🚧 In Progress (Phase 2)
- [ ] Timeline controls with year slider
- [ ] Wikidata SPARQL integration
- [ ] Territory polygon visualization
- [ ] Trade route animations
- [ ] Mobile responsive design

### 📋 Planned (Phase 3)
- [ ] Battle pulse animations
- [ ] Event details panel with sources
- [ ] Search and filter UI
- [ ] Export conversation history
- [ ] Share specific queries via URL

### 🔮 Future Vision
- [ ] Expand to Roman Empire, Renaissance, etc.
- [ ] Vector database for semantic search
- [ ] Graph database for causal relationships
- [ ] Multi-civilization comparative views
- [ ] User-contributed curated datasets

## Research & Best Practices

This project implements research-backed patterns for fact-based AI:

### Preventing Hallucinations

1. **Tool-Based Architecture**: Claude queries database, doesn't generate facts
2. **search_result Format**: Automatic citation generation
3. **Explicit "I Don't Know"**: Permission to admit gaps in knowledge
4. **Sequential Tool Calls**: Prevents parameter guessing
5. **Source Attribution**: Every claim linked to verification

### Based on Anthropic Research

- [Building Effective Agents](https://docs.anthropic.com/en/docs/build-with-claude/developing-with-claude)
- [Tool Use Best Practices](https://docs.anthropic.com/en/docs/build-with-claude/tool-use)
- [Claude Skills Documentation](https://www.anthropic.com/news/skills)

## Contributing

This is an educational project for learning about agentic systems and knowledge graphs. Contributions welcome!

**Priority areas:**
- Additional curated historical datasets
- Wikidata SPARQL query templates
- Visualization improvements
- Mobile UX

## License

MIT License - See LICENSE file for details

## Acknowledgments

- Historical data sourced from Wikipedia with full attribution
- 3D globe powered by react-globe.gl
- AI capabilities powered by Claude (Anthropic)
- Research informed by Anthropic's agent best practices

---

**Built with Claude Code** 🤖
[https://claude.com/claude-code](https://claude.com/claude-code)
