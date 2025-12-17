---
name: time-info
description: Parse and format Swedish date and time expressions, return comprehensive time information. Use when the user asks about dates, times, weekdays, countdowns, or Swedish time expressions like "imorgon", "nästa vecka", "halv tre", "påskafton", or when date/time information is needed for tasks, scheduling, or calendar operations.
allowed-tools: Bash
---

# Swedish Time Information Skill

Parses Swedish date and time expressions and returns comprehensive time information including ISO dates, Swedish weekday/month names, week numbers, and time until next year.

## When to Use

Automatically invoke this skill when:
- User asks about dates: "när är påskafton?", "vilken dag är det imorgon?"
- Time queries: "hur länge till klockan 23:00?", "vad är klockan?"
- Swedish expressions: "nästa vecka", "förra måndagen", "halv tre"
- Scheduling needs: planning tasks, setting deadlines, calendar operations
- Any context requiring date/time parsing or formatting

## How to Use

Call the TypeScript utility function:

```bash
bun run src/utilities/time.ts getTimeInfo "<date expression>"
```

Or use it programmatically in TypeScript:

```typescript
import { getTimeInfo } from './.system/tools/utilities/time';

const result = await getTimeInfo("imorgon klockan 15.30");
```

## Input Formats Supported

### 1. Current Time
- No parameter → returns current date/time

### 2. ISO Formats
- `2025-12-25` → ISO date
- `2025-12-25T14:30` → ISO datetime
- `12.2025` → Month and year (partial)

### 3. Swedish Relative Dates
- `idag`, `igår`, `imorgon`, `i övermorgon`
- `nästa vecka`, `förra veckan`
- `nästa måndag`, `förra fredag`
- `om 3 dagar`, `om 2 veckor`

### 4. Swedish Date Expressions
- `den 15 mars` → 15 March this year
- `sjunde november i år` → 7 November this year
- `mars 2025` → March 2025 (partial)

### 5. Swedish Time Expressions
- `klockan 23.00`, `kl 15:30` → Specific times
- `halv tre` → 2:30 (half to three)
- `kvart över två` → 2:15 (quarter past two)
- `kvart i tre` → 2:45 (quarter to three)

### 6. Combined Date + Time
- `imorgon klockan 15.30`
- `nästa måndag halv tre`
- `nyårsafton i år klockan 23.00`

### 7. Swedish Holidays (via LLM)
- `påskafton nästa år` → Easter Eve
- `midsommarafton 2026` → Midsummer Eve
- `nyårsafton` → New Year's Eve

## Output Format

Returns JSON with all time information:

```json
{
  "date": "2025-12-25",
  "time": "14:30",
  "weekOfYear": "2025-W52",
  "monthOfYear": "12",
  "monthName": "december",
  "dayOfYear": 359,
  "dayOfMonth": 25,
  "weekdayName": "torsdag",
  "timeUntilNextYear": "6 dagar, 9 timmar och 30 minuter",
  "timestamp": 1735134600
}
```

Fields are `null` if parsing fails or information is incomplete.

## Examples

### Example 1: Current Time
```typescript
const now = await getTimeInfo();
// Returns all fields for current date/time
```

### Example 2: Swedish Holiday
```typescript
const easter = await getTimeInfo("påskafton 2026");
// → { date: "2026-04-04", weekdayName: "lördag", ... }
```

### Example 3: Time Query
```typescript
const nye = await getTimeInfo("nyårsafton i år klockan 23.00");
// → { date: "2025-12-31", time: "23:00", timeUntilNextYear: "1 timme", ... }
```

### Example 4: Relative Date
```typescript
const tomorrow = await getTimeInfo("imorgon halv tre");
// → { date: "2025-12-15", time: "02:30", weekdayName: "måndag", ... }
```

## Implementation Details

The utility uses a three-layer parsing strategy:

1. **Layer 1 (Native)**: Fast regex patterns for ISO dates and numeric formats (~0ms)
2. **Layer 2 (chrono-node)**: Swedish natural language patterns with custom Swedish support (~5ms)
3. **Layer 3 (LLM)**: Claude fallback for complex Swedish expressions like holidays (~2-5s)

All Swedish characters (å, ä, ö) are properly handled in pattern matching.

## Important Notes

- Input should be date/time expressions, not questions
  - ✅ Good: `"påskafton nästa år"`
  - ❌ Avoid: `"när är påskafton nästa år?"`
- Time is always in Swedish locale (24-hour format)
- Dates default to current year when not specified
- Partial dates return limited information with null for unknown fields
- All times are in local timezone (CET/CEST for Sweden)
