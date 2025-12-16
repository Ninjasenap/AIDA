# Time Info Skill - Examples

## Basic Usage Examples

### Get Current Time
```typescript
const now = await getTimeInfo();
console.log(`Idag är det ${now.weekdayName} den ${now.dayOfMonth} ${now.monthName}`);
// Output: "Idag är det lördag den 14 december"
```

### Swedish Relative Dates
```typescript
// Tomorrow
await getTimeInfo("imorgon");
// → { date: "2025-12-15", weekdayName: "måndag", ... }

// Yesterday
await getTimeInfo("igår");
// → { date: "2025-12-13", weekdayName: "fredag", ... }

// Next week
await getTimeInfo("nästa vecka");
// → { date: "2025-12-21", ... }

// In 5 days
await getTimeInfo("om 5 dagar");
// → { date: "2025-12-19", ... }
```

### Weekday Navigation
```typescript
// Next Monday
await getTimeInfo("nästa måndag");
// → { date: "2025-12-15", weekdayName: "måndag", ... }

// Last Friday
await getTimeInfo("förra fredag");
// → { date: "2025-12-13", weekdayName: "fredag", ... }
```

### Specific Dates
```typescript
// ISO format
await getTimeInfo("2025-12-25");
// → { date: "2025-12-25", weekdayName: "torsdag", monthName: "december", ... }

// Swedish format
await getTimeInfo("den 20 mars");
// → { date: "2025-03-20", ... }

// Ordinal format
await getTimeInfo("sjunde november i år");
// → { date: "2025-11-07", ... }
```

### Time Expressions
```typescript
// Explicit time
await getTimeInfo("imorgon klockan 15.30");
// → { date: "2025-12-15", time: "15:30", ... }

// Swedish time expressions
await getTimeInfo("nästa måndag halv tre");
// → { date: "2025-12-16", time: "02:30", ... }

await getTimeInfo("om 2 dagar kvart över fyra");
// → { date: "2025-12-16", time: "04:15", ... }
```

### Swedish Holidays
```typescript
// Easter Eve next year
await getTimeInfo("påskafton nästa år");
// → { date: "2025-04-19", weekdayName: "lördag", ... }

// New Year's Eve with time
await getTimeInfo("nyårsafton i år klockan 23.00");
// → { date: "2025-12-31", time: "23:00", timeUntilNextYear: "1 timme", ... }

// Midsummer Eve 2026
await getTimeInfo("midsommarafton 2026");
// → { date: "2026-06-19", weekdayName: "fredag", ... }
```

## Real-World Use Cases

### Task Scheduling
```typescript
// Schedule a task for next Friday
const deadline = await getTimeInfo("nästa fredag");
console.log(`Deadline: ${deadline.date} (${deadline.weekdayName})`);
```

### Countdown Timer
```typescript
// Time until New Year's Eve party
const party = await getTimeInfo("nyårsafton i år klockan 23.00");
console.log(`Party in: ${party.timeUntilNextYear}`);
// Output: "Party in: 17 dagar, 0 timmar och 30 minuter"
```

### Week Number Calculation
```typescript
// What week is Christmas?
const christmas = await getTimeInfo("2025-12-25");
console.log(`Vecka ${christmas.weekOfYear}`);
// Output: "Vecka 2025-W52"
```

### Calendar Integration
```typescript
// Plan weekly meeting
const nextMonday = await getTimeInfo("nästa måndag klockan 10.00");
console.log(`Meeting: ${nextMonday.date} at ${nextMonday.time}`);
```

## Edge Cases

### Partial Dates
```typescript
// Month only
await getTimeInfo("mars 2025");
// → { monthOfYear: "03", monthName: "mars", dayOfMonth: null, ... }

// Year only
await getTimeInfo("2026");
// → { date: null, timestamp: null, ... }
```

### Invalid Dates
```typescript
// Invalid date (Feb 30) - rolls over to March 2
await getTimeInfo("2025-02-30");
// → { date: "2025-03-02", ... }
```

### Complex Expressions
```typescript
// LLM handles complex Swedish
await getTimeInfo("trettondedag jul 2025");
// → { date: "2025-01-06", ... } (Epiphany)
```
