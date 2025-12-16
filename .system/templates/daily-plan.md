# Plan för {{weekday_lowercase}} {{day}} {{month_name}}

## Dagens events
{{#events}}
- {{time}} {{title}}
{{/events}}
{{^events}}
_Inga events inbokade_
{{/events}}

## Fokus för dagen
{{#focus}}
{{index}}. {{title}}
{{/focus}}
{{^focus}}
_Inget fokus valt ännu_
{{/focus}}

## Nästa steg
{{#next_steps}}
- [ ] {{step}}
{{/next_steps}}
{{^next_steps}}
_Inget nästa steg definierat_
{{/next_steps}}

## Parkerade items
{{#parked}}
- {{item}}
{{/parked}}
{{^parked}}
_Inga parkerade items_
{{/parked}}

## Anteckningar
{{notes}}