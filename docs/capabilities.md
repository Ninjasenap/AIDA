# AIDA Capability Architecture

> What AIDA can do: A 4-layer capability model for cognitive augmentation.

## Core Design Philosophy

AIDA exists to **extend human cognitive capacity**, not replace human judgment.

> "It remembers so you can forget. It monitors so you can focus. It structures so you can think freely."

### Success Criteria

The assistant succeeds when the user:
- Feels *less* overwhelmed, not more organized
- Can focus on high-value decisions while routine cognition is externalized
- Experiences the system as an extension of self, not an external tool
- Maintains sustainable performance across all life roles

---

## Anti-Patterns to Avoid

| Anti-Pattern | Description | Why It Fails |
|--------------|-------------|--------------|
| Task Accumulator | Only adds tasks, never removes or deprioritizes | Increases cognitive load |
| Perfect Planner | Creates elaborate plans before action | Blocks activation; plans become stale |
| Passive Responder | Only acts when explicitly asked | Misses proactive intervention |
| Context Amnesiac | Treats each interaction as isolated | Loses compounding value |
| One-Size-Fits-All | Ignores user's current state | Suggestions misaligned with capacity |

---

## Capability Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 4: EMERGENT CAPABILITIES                                 │
│  Strategic guidance, creative amplification, wisdom accumulation│
├─────────────────────────────────────────────────────────────────┤
│  LAYER 3: INTEGRATIVE CAPABILITIES                              │
│  Cross-domain synthesis, relationship intelligence, balance     │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 2: OPERATIONAL CAPABILITIES                              │
│  Task management, scheduling, communication, documentation      │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 1: FOUNDATIONAL CAPABILITIES                             │
│  Memory, context awareness, temporal understanding, user model  │
└─────────────────────────────────────────────────────────────────┘
```

Each higher layer depends on capabilities in lower layers.

---

## Layer 1: Foundational Capabilities

### F1. Persistent Contextual Memory

| ID | Capability | Description |
|----|------------|-------------|
| F1.1 | Episodic Memory | Store/retrieve specific events with context |
| F1.2 | Semantic Memory | Store facts, relationships, structured knowledge |
| F1.3 | Procedural Memory | Store how-to knowledge and patterns |
| F1.4 | Associative Retrieval | Find info based on partial cues |
| F1.5 | Memory Decay Model | Distinguish persistent vs. expiring info |

### F2. User Model

| ID | Capability | Description |
|----|------------|-------------|
| F2.1 | Static Profile | Stable characteristics: roles, values, neurotype |
| F2.2 | Dynamic State | Current energy, mood, focus capacity |
| F2.3 | Behavioral Patterns | Peak hours, procrastination triggers |
| F2.4 | Capacity Model | Current cognitive load, bandwidth |
| F2.5 | Preference Learning | Learn from user choices and feedback |

### F3. Temporal Intelligence

| ID | Capability | Description |
|----|------------|-------------|
| F3.1 | Calendar Awareness | Integration with schedule |
| F3.2 | Rhythm Recognition | Daily, weekly, monthly patterns |
| F3.3 | Lead Time Calculation | Output Friday requires input Tuesday |
| F3.4 | Duration Estimation | Historical task duration learning |
| F3.5 | Temporal Projection | "Start X today, finish by Y" |
| F3.6 | Deadline Topology | Hard vs. soft deadlines |
| F3.7 | Time Debt Tracking | Cost of further delay |

### F4. Role and Domain Model

| ID | Capability | Description |
|----|------------|-------------|
| F4.1 | Role Inventory | Map of all user roles |
| F4.2 | Role Context | Stakeholders, success criteria |
| F4.3 | Role Boundaries | What belongs where |
| F4.4 | Role Switching Detection | Recognize current role |
| F4.5 | Cross-Role Conflict Detection | Competing demands |

---

## Layer 2: Operational Capabilities

### O1. Task Management

| ID | Capability | Description |
|----|------------|-------------|
| O1.1 | Frictionless Capture | Accept any format, normalize |
| O1.2 | Intelligent Classification | Auto-assign role, priority, estimate |
| O1.3 | Next-Step Extraction | Always identify ONE immediate action |
| O1.4 | Just-in-Time Breakdown | Decompose only when executing |
| O1.5 | Dependency Tracking | Surface blockers proactively |
| O1.6 | Status Lifecycle | captured → clarified → ready → planned → done |
| O1.7 | Staleness Detection | Flag stagnant tasks |
| O1.8 | Deliberate Abandonment | Mechanism to decide "not doing" |

**Critical:** Show only the next step unless explicitly requested otherwise.

### O2. Scheduling and Time Blocking

| ID | Capability | Description |
|----|------------|-------------|
| O2.1 | Block Suggestion | Propose time blocks for tasks |
| O2.2 | Calendar Integration | Read/write calendar systems |
| O2.3 | Buffer Insertion | Add transition time |
| O2.4 | Flexibility Preservation | Suggest blocks, not rigid schedules |
| O2.5 | Rescheduling Grace | Adapt without judgment |
| O2.6 | Meeting Prep Triggers | Alert before meetings needing prep |

### O3. Communication Management

| ID | Capability | Description |
|----|------------|-------------|
| O3.1 | Draft Generation | Create drafts per recipient |
| O3.2 | Tone Calibration | Adjust formality per context |
| O3.3 | Promise Tracking | Track commitments made/received |
| O3.4 | Follow-Up Detection | Identify pending follow-ups |

### O4. Document Management

| ID | Capability | Description |
|----|------------|-------------|
| O4.1 | Document Indexing | Searchable document index |
| O4.2 | Semantic Search | Find by meaning |
| O4.3 | Template Management | Reusable templates |
| O4.4 | Knowledge Extraction | Extract facts to memory |

### O5. Activity Logging

| ID | Capability | Description |
|----|------------|-------------|
| O5.1 | Automatic Logging | Capture completions, time spent |
| O5.2 | Prompted Capture | Brief questions at key moments |
| O5.3 | Reflection Prompts | Questions that surface insights |
| O5.4 | Pattern Detection | Identify recurring themes |

---

## Layer 3: Integrative Capabilities

### I1. Cross-Domain Synthesis

| ID | Capability | Description |
|----|------------|-------------|
| I1.1 | Pattern Transfer | Solutions from one domain to another |
| I1.2 | Conflict Detection | Clashing commitments |
| I1.3 | Synergy Detection | Effort benefiting multiple roles |
| I1.4 | Holistic View | Unified picture across roles |

### I2. Work-Life Integration

| ID | Capability | Description |
|----|------------|-------------|
| I2.1 | Boundary Protection | Guard personal time |
| I2.2 | Recovery Scheduling | Ensure adequate rest |
| I2.3 | Role Balance Monitoring | Track distribution |
| I2.4 | Overcommitment Warning | Alert when exceeding capacity |

### I3. Boundary Enforcement

| ID | Capability | Description |
|----|------------|-------------|
| I3.1 | Role Fit Check | Does task fit defined roles? |
| I3.2 | Delegation Suggestions | Who else could handle this? |
| I3.3 | Graceful Decline Drafting | Help formulate "no" |
| I3.4 | Scope Creep Detection | Work expanding beyond agreements |

**Note:** This capability is PROTECTIVE, not PRODUCTIVE. Purpose is to help do LESS, not MORE.

### I4. Crisis Mode

| ID | Capability | Description |
|----|------------|-------------|
| I4.1 | Crisis Detection | Recognize when to suspend normal ops |
| I4.2 | Mode Switching | Reconfigure for crisis |
| I4.3 | Procedure Retrieval | Surface emergency procedures |
| I4.4 | Normal Return | Transition back gracefully |

---

## Layer 4: Emergent Capabilities

### E1. Strategic Guidance

| ID | Capability | Description |
|----|------------|-------------|
| E1.1 | Goal Hierarchy | Track vision to daily tasks |
| E1.2 | Progress Visualization | Show movement toward goals |
| E1.3 | Alignment Checking | Do activities serve goals? |
| E1.4 | Course Correction | Suggest adjustments |

**Review Cadence:**
- Weekly: "Am I moving in the right direction?"
- Monthly: "Is my system working?"
- Quarterly: "Are these the right goals?"
- Annually: "Where am I heading?"

### E2. Creative Amplification

| ID | Capability | Description |
|----|------------|-------------|
| E2.1 | Unsolicited Insight | Offer observations without asking |
| E2.2 | Alternative Framing | Present problems differently |
| E2.3 | Connection Surfacing | Non-obvious links |
| E2.4 | Challenge Posing | Question assumptions |

### E3. Wisdom Accumulation

| ID | Capability | Description |
|----|------------|-------------|
| E3.1 | Pattern Learning | What works for this user |
| E3.2 | Prediction Improvement | Better anticipate needs |
| E3.3 | Mistake Memory | Remember past errors |
| E3.4 | Self-Correction | Adjust based on feedback |

### E4. Health Integration

| ID | Capability | Description |
|----|------------|-------------|
| E4.1 | Stress Signal Detection | Recognize elevated stress |
| E4.2 | Recovery Advocacy | Suggest rest when needed |
| E4.3 | Burnout Prevention | Early warning system |
| E4.4 | Energy Optimization | Maintain energy through day |

---

## Neurotype Adaptations

Adapt behavior based on `{{user.neurotype}}`:

| Challenge | Adaptation Strategy |
|-----------|---------------------|
| Task initiation difficulty | "Smallest first step"; make starting frictionless |
| Working memory limitations | Never require user to remember; externalize |
| Context switching cost | Log interruption points; rich context on resume |
| Overwhelm susceptibility | One thing at a time; hide complexity |
| Time perception challenges | Make time visible; concrete comparisons |
| Emotional sensitivity | Supportive tone, never critical |

---

## Interaction Tone Guidelines

**Always:**
- Supportive and encouraging
- Non-judgmental about deferrals
- Concrete and specific
- Focused on "what next"
- Celebrating small wins

**Never:**
- Guilt-inducing
- Overwhelming with options
- Presumptuous about state
- Dismissive of concerns

---

## Implementation Status

| Layer | Status |
|-------|--------|
| Layer 1: Foundational | Partial - User model, basic temporal |
| Layer 2: Operational | Active - Task management, logging |
| Layer 3: Integrative | Planned - Balance monitoring |
| Layer 4: Emergent | Future - Pattern learning |

See `query-reference.md` for implemented database functions.
