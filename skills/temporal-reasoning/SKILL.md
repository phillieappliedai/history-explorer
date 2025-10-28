---
name: temporal-reasoning
description: Handle temporal queries, date conversions, period calculations, and questions like "What was happening in X when Y occurred?" Manages uncertainty in historical dates.
---

# Temporal Reasoning for Historical Data

This skill provides frameworks for reasoning about time in historical contexts, including uncertainty, calendar conversions, and comparative timelines.

## Core Capabilities

### 1. Date Uncertainty Levels

Historical dates have varying levels of certainty. Always indicate uncertainty:

| Level | Description | Example | Visualization |
|-------|-------------|---------|---------------|
| `exact` | Day-level precision | "April 11, 1241" | Solid marker |
| `month` | Month-level precision | "March 1220" | Slightly transparent |
| `year` | Year-level precision | "1206" | More transparent |
| `circa` | Approximate (±5-10 years) | "circa 1220" | Dashed outline |
| `period` | Range | "1220-1225" | Span visualization |

**Usage:** Always state uncertainty explicitly:
- ✅ "The Battle of Mohi occurred on April 11, 1241 (exact date)"
- ✅ "Genghis Khan was proclaimed in 1206 (year-level precision)"
- ❌ "The Battle of Mohi occurred in April 1241" (ambiguous)

### 2. Temporal Query Patterns

#### Pattern: "What was happening in X when Y?"

**Steps:**
1. Extract time period from Y
2. Determine if Y is a point in time or duration
3. Query events in region X during that time
4. Present with proper context

**Example:**
```
User: "What was happening in Europe when the Mongols sacked Baghdad?"

Process:
1. Baghdad fell: February 1258 (exact)
2. Expand context window: 1255-1260 (5 years)
3. Query European events in this period
4. Present: "While Baghdad fell in 1258, in Europe..."
```

#### Pattern: "How long did X take?"

Calculate duration considering:
- Start date uncertainty
- End date uncertainty
- Calendar systems
- Reporting as range if uncertain

**Example:**
```
"The Mongol conquest of the Jin Dynasty took approximately 23 years (1211-1234),
though sporadic resistance continued until 1234."
```

#### Pattern: "What happened next?"

Temporal succession queries:

1. Identify reference event and date
2. Find next significant event in same narrative chain
3. Calculate time elapsed
4. Provide context for the gap

### 3. Calendar System Awareness

**Julian vs. Gregorian:**
- Gregorian calendar adopted 1582
- All Mongol events use Julian calendar dates
- 10-13 day difference by 13th-14th century

**For dates before 1582:** No conversion needed, store as-is
**For cross-calendar comparisons:** Note the system used

**Chinese Calendar:**
- Mongol sources often use Chinese lunar calendar
- Convert to Julian for display consistency

**Islamic Calendar:**
- Hijri calendar (AH) used in Islamic sources
- Convert: `Gregorian Year ≈ (Hijri Year × 0.97) + 622`

### 4. Period-Based Reasoning

#### Dynasties & Empires

Common overlapping periods relevant to Mongol Empire:

| Entity | Period | Region |
|--------|--------|--------|
| Song Dynasty | 960-1279 | Southern China |
| Jin Dynasty | 1115-1234 | Northern China |
| Khwarazmian Empire | 1077-1231 | Central Asia/Persia |
| Abbasid Caliphate | 750-1258 | Middle East |
| Kievan Rus' | 882-1240 | Eastern Europe |
| Crusader States | 1098-1291 | Levant |
| Holy Roman Empire | 962-1806 | Central Europe |

**Usage:** When user asks about "China" in 1220, specify which dynasty:
- ✅ "In 1220, northern China was ruled by the Jin Dynasty, while the Song Dynasty controlled the south."
- ❌ "In 1220, China was unified." (incorrect)

### 5. Contextual Time Windows

For "contemporary events" queries, use appropriate windows:

| Query Specificity | Time Window |
|-------------------|-------------|
| "same year" | ±1 year |
| "same period" | ±5 years |
| "around the same time" | ±10 years |
| "that century" | Century boundaries |
| "that era" | ±25 years |

### 6. Temporal Relationships

Express causation and sequence:

**Sequential:** "After X, then Y"
- Specify time gap
- Note if relationship is causal or coincidental

**Simultaneous:** "While X, also Y"
- Acknowledge they occurred in same period
- Note if there's any connection

**Causal:** "Because of X, Y occurred"
- Only assert causation if historically supported
- Otherwise use "may have influenced" or "preceded"

**Example:**
```
❌ "Because Ögedei died, the Mongols withdrew from Europe"
✅ "Ögedei's death in December 1241 preceded the Mongol withdrawal from Europe in 1242.
    Historians debate whether this was causal or if other factors were involved."
```

### 7. Handling Conflicting Dates

When sources disagree:

1. Present dominant scholarly view first
2. Note alternative dates: "Some sources cite 1227, others 1228"
3. Explain why dates differ if known (calendar systems, source reliability)
4. Use the most precise available date with uncertainty marker

### 8. Duration Calculations

**For visualization timelines:**

```typescript
function calculateDuration(startDate: string, endDate: string, startUncertainty: DateUncertainty) {
  // If uncertainty is 'circa' or 'period', show as range
  if (startUncertainty === 'circa') {
    return `approximately ${yearDiff} years (±5 years)`;
  }

  // If exact dates, show precise duration
  return `${yearDiff} years, ${monthDiff} months`;
}
```

### 9. Comparative Timelines

When comparing across civilizations:

**Example Response Pattern:**
```
"In 1241, while the Mongols were devastating Hungary at the Battle of Mohi:

• In France: Louis IX was consolidating royal power (reign: 1226-1270)
• In England: Henry III was dealing with baronial reforms
• In the Crusader States: The Seventh Crusade was being planned
• In Japan: The Kamakura Shogunate was in power

Note: These events are contemporary but not causally connected to the Mongol invasion."
```

## Formulas for Common Calculations

### Years Between Events
```
years_diff = end_year - start_year
If uncertainty === 'circa': ±5 years
If uncertainty === 'period': use range midpoint
```

### Ruler's Reign During Event
```
If event_date >= reign_start AND event_date <= reign_end:
  return ruler_name
Else:
  return "No clear ruler during this period"
```

### Century Determination
```
century = Math.ceil(year / 100)
If year <= 0: BCE system (year -500 = 6th century BCE)
```

## Integration with Other Skills

- **With wikidata-historical-queries:** Use temporal windows to query Wikidata
- **With historical-citations:** Always cite sources for contested dates

## Example Queries Handled

1. ✅ "How long after Genghis Khan's death did the Mongols invade Europe?"
   → Calculate: 1242 - 1227 = 15 years later

2. ✅ "What century was the Battle of Mohi?"
   → "13th century (specifically 1241)"

3. ✅ "Show me what was happening worldwide in 1258"
   → Query all regions for events ±2 years of 1258

4. ✅ "Timeline of Mongol expansion from 1206 to 1279"
   → Sequential visualization with dates and rulers

## Best Practices

1. **Always indicate uncertainty:** Never present approximate dates as exact
2. **Provide context:** Don't just give dates, explain their significance in the narrative
3. **Use appropriate precision:** Don't say "March 15" if source only says "March"
4. **Cross-reference:** When dates conflict, note it explicitly
5. **Visualize timelines:** For complex temporal relationships, suggest timeline visualization
