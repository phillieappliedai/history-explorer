---
name: historical-citations
description: Ensure all historical claims are properly cited and attributed. Formats citations according to Claude's search_result format for automatic citation generation. Critical for preventing hallucinations.
---

# Historical Citations

This skill ensures every historical fact presented to the user is properly sourced and verifiable. This is CRITICAL for the History Explorer's mission as an educational tool with zero hallucinations.

## Core Principle

**NEVER state a historical fact without a source.**

If you don't have a source for a claim, you MUST either:
1. Query the database/Wikidata to find a source
2. Explicitly state "I don't have sourced information on this"

## Citation Requirements by Claim Type

### Dates and Events
**Requires citation:**
- Specific dates: "The Battle of Mohi occurred on April 11, 1241"
- Event descriptions: "Mongol forces defeated the Hungarian army"
- Outcomes: "60,000 Hungarians were killed"

**Format:**
```
"The Battle of Mohi occurred on April 11, 1241 [Wikipedia: Battle of Mohi].
Mongol forces under Subutai decisively defeated the Hungarian army,
with estimates of 60,000 Hungarian casualties [Wikipedia: Battle of Mohi]."
```

### Casualties and Statistics
**Always cite and indicate uncertainty:**
- Use "approximately", "estimated", "around" for historical statistics
- Note the source's reliability
- If multiple sources conflict, mention it

**Example:**
```
"Baghdad's population was approximately 1 million before the siege,
dropping to around 100,000 afterward [Wikipedia: Siege of Baghdad (1258)].
These are estimates, as precise demographic data for this period is unavailable."
```

### Cause and Effect
**Distinguish between:**
- Established causation (well-sourced)
- Historical debate (cite multiple perspectives)
- Speculation (clearly mark as such)

**Examples:**

✅ **Established:**
"The execution of Mongol envoys by Shah Muhammad directly precipitated
Genghis Khan's invasion of Khwarazm [Wikipedia: Mongol conquest of Khwarazm]."

✅ **Debated:**
"Historians debate whether Ögedei Khan's death caused the Mongol withdrawal
from Europe. Some scholars argue it was decisive [Source A], while others
suggest logistical factors played a larger role [Source B]."

❌ **Speculation without acknowledgment:**
"The Mongols would have conquered all of Europe if Ögedei hadn't died."

## Claude's Citation Format

Use `search_result` format for automatic citation generation:

```json
{
  "type": "search_result",
  "source": "https://en.wikipedia.org/wiki/Battle_of_Mohi",
  "title": "Battle of Mohi - Wikipedia",
  "citations": {"enabled": true},
  "content": [
    {
      "type": "text",
      "text": "The Battle of Mohi (April 11, 1241) was one of the most devastating defeats in European military history. Mongol forces under Subutai and Batu Khan destroyed the Hungarian army under King Béla IV. Hungarian casualties were catastrophic, with estimates around 60,000 killed."
    }
  ]
}
```

This format ensures Claude's Citations API automatically:
- Links each claim to its source
- Provides hover tooltips with source info
- Allows users to verify any claim instantly

## Citation Hierarchy

**Prioritize sources in this order:**

1. **Curated dataset** (highest trust)
   - Manually verified facts with Wikipedia citations
   - Use these first for core Mongol events

2. **Wikidata** (structured knowledge)
   - Machine-readable, traceable
   - Include Wikidata ID for verification
   - Format: `[Wikidata Q159916]`

3. **Wikipedia** (encyclopedic)
   - Generally reliable for established history
   - Check "References" section for primary sources
   - Format: `[Wikipedia: Article Name]`

4. **Academic sources** (when available)
   - Highest scholarly standards
   - Format: `[Author, Year]` with full citation in sources panel

## Handling Source Conflicts

When sources disagree:

### Pattern 1: Present Dominant View + Alternatives

```
"Genghis Khan died in August 1227 according to most sources [Wikipedia: Genghis Khan],
though some Persian chronicles suggest it may have been earlier [Rashid al-Din, Jami' al-tawarikh].
The exact date remains uncertain due to the Mongols keeping his death secret initially."
```

### Pattern 2: Acknowledge Uncertainty Explicitly

```
"The exact population of Baghdad before the 1258 siege is unknown. Estimates range
from 500,000 to 1.5 million [Various sources cited in Wikipedia: Siege of Baghdad (1258)].
Contemporary chroniclers' figures are considered exaggerated by modern historians."
```

### Pattern 3: Multiple Perspectives for Interpretive Questions

```
User: "Why did the Mongols withdraw from Europe?"

Response:
"Historians offer several explanations for the Mongol withdrawal from Europe in 1242:

1. **Succession Crisis**: Ögedei Khan's death in 1241 required Batu Khan to return
   for the kurultai (succession assembly) [Wikipedia: Mongol invasion of Europe].

2. **Logistical Constraints**: Some scholars argue the Mongol supply lines were
   overextended and European terrain unsuited to their tactics [Academic source].

3. **Strategic Satisfaction**: Others suggest the Mongols achieved their objectives
   and had no interest in permanent European conquest [Academic source].

The relative importance of these factors remains debated among historians."
```

## Anti-Hallucination Checklist

Before presenting ANY historical fact, verify:

- [ ] Is this from the curated dataset? ✅ Use it with citation
- [ ] Is this from Wikidata query? ✅ Use with Wikidata ID
- [ ] Am I inferring this from general knowledge? ❌ STOP - Query sources first
- [ ] Am I making a causal claim? ✅ Ensure it's well-sourced or mark as interpretation
- [ ] Am I giving statistics? ✅ Cite source and note uncertainty

## Phrases That REQUIRE Citations

These phrases trigger the citation requirement:

- "occurred on [date]" → Cite source for exact date
- "approximately [number]" → Cite source for statistic
- "[person] said/believed/thought" → Cite historical record
- "caused [outcome]" → Cite historical analysis
- "marked the beginning/end of" → Cite historical assessment

## Phrases for Uncertain Information

Use these when data is unavailable:

- "I don't have sourced information on..."
- "The historical record is unclear about..."
- "While contemporary sources mention X, modern historians question..."
- "Precise data for this period is unavailable, but estimates suggest..."

## Examples of Proper Citation Usage

### ✅ GOOD: Full Attribution

```
"The Battle of Legnica (April 9, 1241) saw Mongol forces defeat a Polish-German
coalition [Wikipedia: Battle of Legnica]. The battle occurred the same day as the
Battle of Mohi in Hungary, demonstrating the Mongols' ability to coordinate
operations across vast distances [Wikipedia: Battle of Legnica]. An estimated
25,000 European soldiers were killed [Wikipedia: Battle of Legnica], though
precise casualty figures from medieval battles should be treated as approximate."
```

### ❌ BAD: Unsourced Claims

```
"The Battle of Legnica was the bloodiest battle in medieval European history.
The Mongols killed every single soldier, and this terrified all of Europe,
causing them to immediately surrender."
```
(Problems: Superlative claim unsourced, casualty claim exaggerated, outcome claim false)

## Integration with Visualization

When events are displayed on the globe:

- **Hover tooltip:** Show event name + date
- **Click details panel:** Full description with inline citations
- **"View Sources" button:** Expandable list of all sources for that event

Example panel structure:
```
┌─────────────────────────────────────┐
│ Battle of Mohi                      │
│ April 11, 1241                      │
├─────────────────────────────────────┤
│ [Event description with citations]  │
│                                     │
│ [View Sources (2)] ▼                │
└─────────────────────────────────────┘

Expanded:
┌─────────────────────────────────────┐
│ Sources:                            │
│ 1. Wikipedia: Battle of Mohi        │
│    https://en.wikipedia.org/...     │
│ 2. Wikidata Q159916                 │
│    https://www.wikidata.org/...     │
└─────────────────────────────────────┘
```

## User Trust Indicators

Visual signals that information is sourced:

- 🟢 **Green indicator:** Curated dataset (highest confidence)
- 🔵 **Blue indicator:** Wikidata (structured, verifiable)
- 🟡 **Yellow indicator:** Expanded data (good but not manually verified)
- 🔴 **Red indicator:** Conflicting sources (user should investigate)

## Handling "I Don't Know"

When the database lacks information, respond confidently:

```
User: "What was Genghis Khan's favorite food?"

❌ BAD: "Genghis Khan enjoyed mutton and fermented mare's milk."
(This is general knowledge about Mongol diet, not specific sourced fact)

✅ GOOD: "I don't have specific sourced information about Genghis Khan's
personal food preferences in my historical database. While Mongol diets
generally included mutton and airag (fermented mare's milk), making claims
about individuals' preferences requires historical documentation I don't have access to."
```

## Summary

**Every fact in History Explorer must be:**
1. Sourced from a verifiable database or knowledge base
2. Properly attributed with citations
3. Presented with appropriate uncertainty
4. Marked clearly if interpretive or debated

**This is non-negotiable for an educational tool.**
