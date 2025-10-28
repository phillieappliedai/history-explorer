---
name: wikidata-historical-queries
description: Query Wikidata for historical events, battles, territories, and people using SPARQL. Use when user asks for events beyond the curated dataset or wants to expand to other historical periods.
---

# Wikidata Historical Queries

This skill provides SPARQL query templates for retrieving structured historical data from Wikidata's knowledge graph.

## When to Use This Skill

- User asks about events not in the curated Mongol dataset
- User wants to explore contemporary events in other regions
- User requests expansion to other historical periods
- User asks "What else was happening...?" questions

## Core SPARQL Templates

### Find Contemporary Events by Time Period

```sparql
SELECT ?event ?eventLabel ?date ?location ?locationLabel ?coordinates
WHERE {
  ?event wdt:P31/wdt:P279* wd:Q1190554.  # Instance of historical event
  ?event wdt:P585 ?date.                 # Point in time
  FILTER(YEAR(?date) >= {start_year} && YEAR(?date) <= {end_year})

  OPTIONAL {
    ?event wdt:P276 ?location.           # Location
    ?location wdt:P625 ?coordinates.      # Coordinates
  }

  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT 50
```

**Parameters:**
- `{start_year}`: Starting year (e.g., 1240)
- `{end_year}`: Ending year (e.g., 1245)

### Find Battles in a Conflict

```sparql
SELECT ?battle ?battleLabel ?date ?coordinates ?partOfLabel
WHERE {
  ?battle wdt:P31 wd:Q178561.            # Instance of battle
  ?battle wdt:P361* wd:Q12557.           # Part of Mongol conquests

  OPTIONAL { ?battle wdt:P585 ?date. }
  OPTIONAL { ?battle wdt:P625 ?coordinates. }
  OPTIONAL { ?battle wdt:P361 ?partOf. }

  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
ORDER BY ?date
```

### Find Events in a Geographic Region

```sparql
SELECT ?event ?eventLabel ?date ?eventTypeLabel
WHERE {
  ?event wdt:P31/wdt:P279* wd:Q1190554.  # Historical event
  ?event wdt:P276 ?location.             # Location
  ?location wdt:P17 wd:{country_id}.     # Country

  OPTIONAL { ?event wdt:P585 ?date. }
  OPTIONAL { ?event wdt:P31 ?eventType. }

  FILTER(YEAR(?date) >= {start_year} && YEAR(?date) <= {end_year})

  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
ORDER BY ?date
LIMIT 30
```

**Common Country IDs:**
- Europe: wd:Q46 (continent)
- England: wd:Q21
- France: wd:Q142
- Holy Roman Empire: wd:Q12548
- China: wd:Q29520 (Jin Dynasty), wd:Q7462 (Song Dynasty)
- Japan: wd:Q17

### Find Historical Figures by Period

```sparql
SELECT ?person ?personLabel ?birthDate ?deathDate ?occupationLabel
WHERE {
  ?person wdt:P31 wd:Q5.                 # Instance of human
  ?person wdt:P569 ?birthDate.           # Date of birth
  ?person wdt:P570 ?deathDate.           # Date of death

  FILTER(YEAR(?birthDate) >= {start_year} && YEAR(?birthDate) <= {end_year})

  OPTIONAL { ?person wdt:P106 ?occupation. }

  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
ORDER BY ?birthDate
LIMIT 20
```

## Data Quality Considerations

**Always check for:**
- Missing dates: Many historical events lack precise dates
- Coordinate precision: Wikidata coordinates may not be exact for historical locations
- Completeness: Not all historical events are in Wikidata
- Conflicting data: Check `wdt:P2868` (subject has role) for clarifications

## Example Usage

**User Query:** "What was happening in Europe when Genghis Khan invaded China in 1215?"

**Response Strategy:**
1. Identify timeframe: 1210-1220
2. Query Wikidata for European events in that period
3. Present results with attribution: "According to Wikidata..."
4. Combine with curated data for complete answer

## Citation Format

When returning Wikidata results, format as:

```json
{
  "type": "search_result",
  "source": "https://www.wikidata.org/wiki/{entity_id}",
  "title": "{event_name} - Wikidata",
  "content": [
    {
      "type": "text",
      "text": "{event_description}"
    }
  ]
}
```

## Limitations

- Wikidata coverage varies by region and period
- Medieval European events: Good coverage
- Asian events pre-1500: Moderate coverage
- African events pre-1800: Limited coverage
- Always supplement with curated data when available

## When NOT to Use

- For core Mongol Empire events (use curated dataset instead)
- When user needs deep historical analysis (use temporal-reasoning skill)
- For citation formatting (use historical-citations skill)
