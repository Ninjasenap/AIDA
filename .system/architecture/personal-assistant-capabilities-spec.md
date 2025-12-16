# Personal AI Assistant — Capability Specification

> **Document Type:** Architectural Requirements for Solution Architect Agent
> **Version:** 1.2
> **Date:** 2025-12-13
> **Purpose:** Define the complete capability set required for a personal AI assistant that functions as cognitive augmentation rather than task automation

---

## 1. Core Design Philosophy

### 1.1 Fundamental Principle

The assistant exists to **extend human cognitive capacity**, not replace human judgment. The design goal is expressed as:

```
"It remembers so you can forget. It monitors so you can focus. It structures so you can think freely."
```

### 1.2 Anti-Patterns to Avoid

| Anti-Pattern | Description | Why It Fails |
|--------------|-------------|--------------|
| Task Accumulator | System that only adds tasks, never removes or deprioritizes | Increases cognitive load instead of reducing it |
| Perfect Planner | System that creates elaborate plans before action | Blocks activation; plans become stale |
| Passive Responder | System that only acts when explicitly asked | Misses proactive intervention opportunities |
| Context Amnesiac | System that treats each interaction as isolated | Loses the compounding value of accumulated understanding |
| One-Size-Fits-All | System that ignores user's current state | Suggestions misaligned with actual capacity |

### 1.3 Success Criteria

The assistant succeeds when the user:
- Feels *less* overwhelmed, not more organized
- Can focus attention on high-value decisions while routine cognition is externalized
- Experiences the system as an extension of self, not an external tool to manage
- Maintains sustainable performance across all life roles over time

---

## 2. Capability Architecture

The capabilities are organized in four layers, from foundational to emergent:

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

## 3. Layer 1: Foundational Capabilities

These capabilities form the substrate on which all other capabilities depend.

### 3.1 Persistent Contextual Memory

**Definition:** The ability to store, retrieve, and meaningfully connect information across time and domains.

**Sub-capabilities:**

| ID | Capability | Description | Example |
|----|------------|-------------|---------|
| F1.1 | Episodic Memory | Store and retrieve specific events with context | "What happened in the M365 security meeting on November 15?" |
| F1.2 | Semantic Memory | Store facts, relationships, and structured knowledge | "What are the current deployment policies for the production domain?" |
| F1.3 | Procedural Memory | Store how-to knowledge and successful patterns | "How did we solve the Hybrid Azure AD Join issue last time?" |
| F1.4 | Associative Retrieval | Find relevant information based on partial or contextual cues | User mentions "that vendor issue" → retrieve specific vendor conflict from 3 months ago |
| F1.5 | Memory Decay Model | Distinguish between information that should persist vs. expire | Meeting logistics expire; strategic decisions persist |

**Data Requirements:**
- Structured storage for events, facts, procedures
- Vector embeddings for semantic search
- Temporal indexing for time-based queries
- Confidence scoring for memory reliability
- Source attribution for traceability

### 3.2 User Model

**Definition:** A continuously updated representation of the user including traits, preferences, patterns, current state, and capacity.

**Sub-capabilities:**

| ID | Capability | Description |
|----|------------|-------------|
| F2.1 | Static Profile | Stable characteristics: roles, values, preferences, neurotype |
| F2.2 | Dynamic State | Current energy, mood, focus capacity, stress level |
| F2.3 | Behavioral Patterns | Recurring tendencies: peak hours, procrastination triggers, communication style |
| F2.4 | Capacity Model | Current cognitive load, commitment level, available bandwidth |
| F2.5 | Preference Learning | Implicit learning from user choices and feedback |

**User Profile Structure:**

The user's cognitive profile is defined in `{{user.neurotype}}` which includes:
- `label`: Neurotype designation (e.g., "Neurotypical", "ADHD", "AuDHD", etc.)
- `challenges`: Specific cognitive challenges with descriptions and assistant responses
- `effective_strategies`: Strategies that work well for this user

Energy patterns are defined in `{{user.energy_pattern}}` with:
- `high`: Time range, suitable activities, and activities to avoid
- `medium`: Same structure
- `low`: Same structure

Roles are defined in `{{user.roles}}`, typically organized as A01-A10 or similar codes, each with:
- `name`: Role name
- `type`: Category (work, civic, personal, private, meta)
- `description`: What this role involves
- `organization`: Associated organization (if applicable)

**Design Implication:** All assistant outputs must be filtered through current user state. A suggestion appropriate for high energy periods is inappropriate for low energy periods.

### 3.3 Temporal Intelligence

**Definition:** Understanding of time as a structured dimension including rhythms, deadlines, durations, sequences, and projections.

**Sub-capabilities:**

| ID | Capability | Description |
|----|------------|-------------|
| F3.1 | Calendar Awareness | Integration with schedule; understanding of committed time |
| F3.2 | Rhythm Recognition | Daily, weekly, monthly, quarterly, annual patterns |
| F3.3 | Lead Time Calculation | Understanding that output on Friday requires input on Tuesday |
| F3.4 | Duration Estimation | Historical learning about how long tasks actually take |
| F3.5 | Temporal Projection | "If you start X today, you'll finish by Y" |
| F3.6 | Deadline Topology | Understanding hard vs. soft deadlines, consequences of missing each |
| F3.7 | Time Debt Tracking | How long has something been waiting? What's the cost of further delay? |

**Example Application:**
```
Input: Task "Prepare board presentation" with deadline December 20
Processing:
  - Current date: December 13
  - User pattern: Needs 2 review cycles for important presentations
  - Historical duration: Similar tasks took 4-6 hours
  - Calendar scan: December 16-17 have open morning blocks
Output: "Board presentation needs to start by Monday December 16 morning 
        to allow for review cycles. Suggesting 3-hour block."
```

### 3.4 Role and Domain Model

**Definition:** Understanding of the user's multiple roles, their boundaries, their contexts, and their relative priorities.

**Sub-capabilities:**

| ID | Capability | Description |
|----|------------|-------------|
| F4.1 | Role Inventory | Complete map of all user roles with definitions |
| F4.2 | Role Context | What each role involves, who the stakeholders are, what success looks like |
| F4.3 | Role Boundaries | What belongs to each role, what doesn't |
| F4.4 | Role Switching Detection | Recognize when user is operating in which role |
| F4.5 | Cross-Role Conflict Detection | Identify when roles have competing demands |

**Role Structure:**

Roles are loaded from `{{user.roles}}` in the user profile. Each installation has its own role structure adapted to the user's life and responsibilities.

**Example structure (actual roles are user-defined):**
```
A01: Meta/overflow category
A02-A05: Primary work roles
A06: Civic/volunteer commitments
A07: Personal development
A08: Side projects/business
A09: Family and home
A10: Personal hobbies
```

The specific roles, organizations, and descriptions are defined in the user profile and may vary significantly between users.

**Design Principle:** Every task MUST belong to exactly one role. Tasks without role assignment indicate scope creep or unclear boundaries.

---

## 4. Layer 2: Operational Capabilities

These capabilities handle the day-to-day mechanics of assistance.

### 4.1 Task Management

**Definition:** Complete lifecycle management of tasks from capture through completion or deliberate abandonment.

**Sub-capabilities:**

| ID | Capability | Description |
|----|------------|-------------|
| O1.1 | Frictionless Capture | Accept task input in any format; normalize to structured form |
| O1.2 | Intelligent Classification | Auto-assign role, priority, time estimate, dependencies |
| O1.3 | Next-Step Extraction | Always identify the ONE immediate next action |
| O1.4 | Just-in-Time Breakdown | Decompose tasks only when about to be executed, not before |
| O1.5 | Dependency Tracking | Understand what blocks what; surface blockers proactively |
| O1.6 | Status Lifecycle | Track: captured → clarified → ready → in-progress → blocked → done/abandoned |
| O1.7 | Staleness Detection | Flag tasks that have sat too long without progress |
| O1.8 | Deliberate Abandonment | Provide mechanism to explicitly decide not to do something |

**Critical Design Requirement — Activation Over Perfection:**

```
WRONG: "Here are the 47 steps to complete your tax declaration"
RIGHT: "The smallest first step is: Open the Skatteverket website. Just that. 
        Do you want me to prepare the link?"
```

The system must resist the urge to show complete plans. Show only the next step unless explicitly requested otherwise.

### 4.2 Scheduling and Time Blocking

**Definition:** Allocation of time to tasks with respect to user capacity, preferences, and constraints.

**Sub-capabilities:**

| ID | Capability | Description |
|----|------------|-------------|
| O2.1 | Block Suggestion | Propose time blocks aligned with task nature and user energy |
| O2.2 | Calendar Integration | Read from and write to calendar systems |
| O2.3 | Buffer Insertion | Automatically add transition time between blocks |
| O2.4 | Flexibility Preservation | Suggest blocks, not minute-by-minute schedules |
| O2.5 | Rescheduling Grace | When plans change, adapt without judgment |
| O2.6 | Meeting Preparation Triggers | Alert user N hours before meetings requiring prep |

**Energy-Aware Scheduling Rules:**

Energy-aware scheduling uses `{{user.energy_pattern}}` to match tasks with optimal times. The system reads:
- `{{user.energy_pattern.high}}`: Time range, suitable task types, tasks to avoid
- `{{user.energy_pattern.medium}}`: Same structure
- `{{user.energy_pattern.low}}`: Same structure

For each energy level, the profile defines:
- `time_range`: When this energy level occurs (e.g., "05:00-12:00", "evening")
- `suitable_for`: List of activity types that work well at this energy level
- `avoid`: List of activity types that should not be scheduled for this energy level

The scheduling algorithm queries the user's current time against these patterns to determine capacity and appropriate task types.

### 4.3 Communication Management

**Definition:** Support for all forms of communication including drafting, tracking, and relationship maintenance.

**Sub-capabilities:**

| ID | Capability | Description |
|----|------------|-------------|
| O3.1 | Draft Generation | Create communication drafts adapted to recipient and context |
| O3.2 | Tone Calibration | Adjust formality, directness, detail level per recipient |
| O3.3 | Promise Tracking | Track commitments made by user AND to user |
| O3.4 | Follow-Up Detection | Identify communications requiring follow-up |
| O3.5 | Response Suggestion | Propose responses to incoming communications |
| O3.6 | Stakeholder Briefing | Summarize relationship history before interactions |

**Communication Context Model:**

```yaml
recipient_attributes:
  - role: (politician | manager | colleague | vendor | family | other)
  - organization: (internal | external | civic | personal)
  - relationship_history: (new | established | complex)
  - communication_preference: (formal | informal | direct | diplomatic)
  - pending_items: [list of open threads]
```

### 4.4 Document and Knowledge Management

**Definition:** Organization, retrieval, and synthesis of the user's document corpus.

**Sub-capabilities:**

| ID | Capability | Description |
|----|------------|-------------|
| O4.1 | Document Indexing | Maintain searchable index of all user documents |
| O4.2 | Semantic Search | Find documents by meaning, not just keywords |
| O4.3 | Version Awareness | Track document evolution over time |
| O4.4 | Cross-Reference Detection | Identify when documents relate to each other |
| O4.5 | Template Management | Maintain and suggest reusable templates |
| O4.6 | Knowledge Extraction | Extract key facts from documents into structured memory |
| O4.7 | Synthesis Generation | Create summaries that combine multiple source documents |

### 4.5 Information Monitoring

**Definition:** Continuous surveillance of information streams with intelligent filtering and escalation.

**Sub-capabilities:**

| ID | Capability | Description |
|----|------------|-------------|
| O5.1 | Source Integration | Connect to email, message center, news feeds, etc. |
| O5.2 | Relevance Filtering | Score incoming information by relevance to user |
| O5.3 | Noise Suppression | Filter out low-value information automatically |
| O5.4 | Signal Detection | Identify information requiring user attention |
| O5.5 | Escalation Logic | Determine what merits interruption vs. daily digest vs. ignore |
| O5.6 | Trend Detection | Identify patterns across information streams |

**Escalation Matrix:**

```
IMMEDIATE INTERRUPT:
  - Crisis signals (security breach, system down)
  - TiB duty calls
  - Family emergencies
  
SAME-DAY ATTENTION:
  - Deadline changes affecting this week
  - Requests from leadership
  - Blocked dependencies unblocked
  
DAILY DIGEST:
  - Routine updates
  - FYI communications
  - Non-urgent requests
  
AUTO-ARCHIVE:
  - Newsletters (unless explicitly subscribed)
  - System notifications (log only)
  - Marketing communications
```

### 4.6 Activity Logging

**Definition:** Automatic and low-friction recording of what the user does, decides, and experiences.

**Sub-capabilities:**

| ID | Capability | Description |
|----|------------|-------------|
| O6.1 | Automatic Logging | Capture task completions, time spent, context switches |
| O6.2 | Prompted Capture | Ask brief questions at key moments (post-meeting, end-of-day) |
| O6.3 | Reflection Prompts | Generate questions that surface insights |
| O6.4 | Pattern Detection | Identify recurring themes in logs over time |
| O6.5 | Narrative Generation | Create human-readable summaries of periods |

**Logging Philosophy:**
```
Maximize capture, minimize burden.
Log automatically when possible.
Ask only high-value questions.
Never require mandatory logging.
```

---

## 5. Layer 3: Integrative Capabilities

These capabilities synthesize across domains and time horizons.

### 5.1 Cross-Domain Synthesis

**Definition:** The ability to see connections and transfer knowledge between different roles and contexts.

**Sub-capabilities:**

| ID | Capability | Description |
|----|------------|-------------|
| I1.1 | Pattern Transfer | Recognize when a solution in one domain applies to another |
| I1.2 | Conflict Detection | Identify when commitments in different roles clash |
| I1.3 | Synergy Detection | Find opportunities where effort in one role benefits another |
| I1.4 | Holistic View Generation | Create unified picture across all roles |

### 5.2 Relationship Intelligence

**Definition:** Deep understanding of the user's network of relationships and how to navigate them effectively.

**Sub-capabilities:**

| ID | Capability | Description |
|----|------------|-------------|
| I2.1 | Relationship Mapping | Maintain model of key relationships and their dynamics |
| I2.2 | Interaction History | Track the arc of each relationship over time |
| I2.3 | Social Context Reading | Understand implicit meanings in communications |
| I2.4 | Political Awareness | Understand organizational dynamics and sensitivities |
| I2.5 | Reciprocity Tracking | Balance of asks vs. gives in each relationship |
| I2.6 | Relationship Maintenance | Prompt for relationship-maintaining actions |

**Relationship Model Structure:**

```yaml
relationship:
  person_id: unique identifier
  name: display name
  context: how user knows this person
  organizations: [list of shared orgs]
  roles_intersection: [which user roles interact with this person]
  communication_style: preferences for interacting
  history:
    - event: "Collaborated on M365 rollout"
      date: 2024-03
      outcome: positive
    - event: "Disagreement on security policy"
      date: 2024-09
      outcome: resolved, required careful navigation
  open_items:
    - "Owes response on integration question"
  sentiment_trajectory: improving | stable | declining | unknown
```

### 5.3 Work-Life Integration

**Definition:** Management of the balance between professional and personal commitments to ensure sustainable performance.

**Sub-capabilities:**

| ID | Capability | Description |
|----|------------|-------------|
| I3.1 | Boundary Protection | Guard personal time from work encroachment |
| I3.2 | Recovery Scheduling | Ensure adequate recovery time is planned |
| I3.3 | Role Balance Monitoring | Track time/energy distribution across roles |
| I3.4 | Overcommitment Warning | Alert when commitments exceed sustainable capacity |
| I3.5 | Family Integration | Coordinate personal commitments with family calendar |

**Balance Monitoring:**

Balance targets are defined in `{{user.balance_targets}}` which includes:

`weekly_distribution`: Target percentage or hours for each role
- User defines their ideal distribution across all roles
- Can be asymmetric based on life circumstances
- May include variable allocations (e.g., on-call weeks vs. regular weeks)

- `alert_triggers`: Thresholds for warnings
- `role_over_target_weeks`: Alert if role exceeds target for N consecutive weeks
- `role_over_target_percent`: Alert if role exceeds target by X%
- `family_under_target_percent`: Alert if family/personal roles fall below X%
- `professional_combined_max`: Maximum % for all professional roles combined
- `professional_alert_weeks`: Alert if professional maximum exceeded for N weeks

The system monitors actual time allocation against these targets and generates warnings when thresholds are exceeded.

### 5.4 Boundary Enforcement

**Definition:** Active protection against scope creep and commitment to things outside the user's defined responsibilities.

**Sub-capabilities:**

| ID | Capability | Description |
|----|------------|-------------|
| I4.1 | Role Fit Check | Evaluate if new task/request fits user's defined roles |
| I4.2 | Delegation Suggestions | Identify who else could/should handle something |
| I4.3 | Graceful Decline Drafting | Help formulate "no" responses that maintain relationships |
| I4.4 | Scope Creep Detection | Alert when work is expanding beyond agreements |
| I4.5 | Renegotiation Support | Help adjust commitments when boundaries are exceeded |

**Critical Function:**
```
This capability is PROTECTIVE, not PRODUCTIVE.
Its purpose is to help the user do LESS, not MORE.
A system without this capability accelerates burnout.
```

### 5.5 Crisis Mode Capability

**Definition:** Ability to shift operational mode during emergencies or high-priority situations.

**Sub-capabilities:**

| ID | Capability | Description |
|----|------------|-------------|
| I5.1 | Crisis Detection | Recognize when normal operations should be suspended |
| I5.2 | Mode Switching | Reconfigure assistant behavior for crisis context |
| I5.3 | Procedure Retrieval | Instantly surface relevant emergency procedures |
| I5.4 | Action Logging | Detailed logging of crisis response for debrief |
| I5.5 | Stakeholder Communication | Help coordinate communication during incidents |
| I5.6 | Normal Return | Gracefully transition back to normal operations |

**Crisis Mode Configuration (Example):**

Crisis modes are configured per user based on their responsibilities. A role marked with `special_mode: true` or `crisis_mode_enabled: true` in `{{user.roles}}` can trigger specialized behavior.

Example configuration for an on-call/duty role:
```yaml
activation_triggers:
  - Manual activation by user
  - Duty week detection + incoming alert
  - Explicit crisis signal

behavior_changes:
  - Suppress all non-urgent notifications
  - Prioritize rapid response over thorough analysis
  - Surface emergency contacts and procedures immediately
  - Log all actions with timestamps
  - Suggest escalation paths proactively

available_resources:
  - Crisis management handbook (quick-access index)
  - Emergency contact list
  - Incident report templates
  - Previous incident logs for pattern matching
```

---

## 6. Layer 4: Emergent Capabilities

These capabilities represent the highest-value functions that emerge from the integration of all lower layers.

### 6.1 Strategic Guidance

**Definition:** Support for long-term thinking, goal-setting, and alignment of daily actions with larger purposes.

**Sub-capabilities:**

| ID | Capability | Description |
|----|------------|-------------|
| E1.1 | Goal Hierarchy Maintenance | Track goals from vision to daily tasks |
| E1.2 | Progress Visualization | Show movement toward long-term objectives |
| E1.3 | Alignment Checking | Evaluate if current activities serve stated goals |
| E1.4 | Goal Review Facilitation | Guide periodic goal reflection sessions |
| E1.5 | Course Correction | Suggest adjustments when trajectory diverges from goals |
| E1.6 | Opportunity Recognition | Identify chances to advance goals not currently in focus |

**Review Cadence:**

```
┌─────────────────────────────────────────────────────────┐
│ LEVEL     │ FREQUENCY  │ QUESTION                       │
├───────────┼────────────┼────────────────────────────────┤
│ Tactical  │ Weekly     │ "Am I moving in the right      │
│           │            │  direction?"                   │
├───────────┼────────────┼────────────────────────────────┤
│ Operative │ Monthly    │ "Is my system working?"        │
├───────────┼────────────┼────────────────────────────────┤
│ Strategic │ Quarterly  │ "Are these the right goals?"   │
├───────────┼────────────┼────────────────────────────────┤
│ Vision    │ Annually   │ "Where am I heading in life?"  │
└───────────┴────────────┴────────────────────────────────┘
```

### 6.2 Creative Amplification

**Definition:** Active contribution of ideas, perspectives, and connections the user hasn't requested but might value.

**Sub-capabilities:**

| ID | Capability | Description |
|----|------------|-------------|
| E2.1 | Unsolicited Insight | Offer relevant observations without being asked |
| E2.2 | Alternative Framing | Present problems from different angles |
| E2.3 | Connection Surfacing | Notice non-obvious links between disparate items |
| E2.4 | Challenge Posing | Respectfully question assumptions and plans |
| E2.5 | Inspiration Injection | Introduce relevant external ideas and examples |
| E2.6 | Brainstorming Partnership | Engage in generative ideation sessions |

**Constraints:**
```
Creative amplification must be:
  - Relevant to user's current context or goals
  - Timed appropriately (not during crisis or low energy)
  - Offered, not imposed (easy to dismiss)
  - Traceable to reasoning (explain why surfaced)
```

### 6.3 Wisdom Accumulation

**Definition:** Learning from the user's experiences to provide increasingly personalized and effective support.

**Sub-capabilities:**

| ID | Capability | Description |
|----|------------|-------------|
| E3.1 | Pattern Learning | Identify what works and doesn't work for this user |
| E3.2 | Prediction Improvement | Better anticipate user needs over time |
| E3.3 | Mistake Memory | Remember past errors to prevent repetition |
| E3.4 | Success Amplification | Reinforce approaches that yield good results |
| E3.5 | Self-Correction | Adjust assistant behavior based on user feedback |
| E3.6 | Insight Synthesis | Generate meta-observations about user patterns |

**Learning Domains:**

```yaml
behavioral_learning:
  - Which activation techniques actually work
  - Accurate task duration predictions
  - Optimal times for different task types
  - Communication styles that resonate with specific recipients

preference_learning:
  - Output format preferences
  - Level of detail desired
  - Interaction frequency tolerance
  - Unsolicited input receptivity

strategic_learning:
  - Which goals persist vs. get abandoned
  - What causes projects to stall
  - Sources of sustainable motivation
  - Early warning signs of overload
```

### 6.4 Health and Wellbeing Integration

**Definition:** Consideration of physical and mental health as factors in cognitive capacity and sustainable performance.

**Sub-capabilities:**

| ID | Capability | Description |
|----|------------|-------------|
| E4.1 | Stress Signal Detection | Recognize signs of elevated stress in user behavior |
| E4.2 | Recovery Advocacy | Actively suggest rest when patterns indicate need |
| E4.3 | Health Habit Support | Support routines that maintain cognitive capacity |
| E4.4 | Burnout Prevention | Early warning system for unsustainable patterns |
| E4.5 | Energy Optimization | Suggestions for maintaining energy through the day |

**Warning Signs to Monitor:**

```yaml
elevated_stress_indicators:
  - Unusual hours of activity
  - Increased task deferrals
  - Shortened response patterns
  - Decreased engagement with planning
  - Increased "firefighting" vs. planned work

recommended_responses:
  - Reduce suggestion complexity
  - Offer smaller next steps
  - Proactively suggest breaks
  - Delay non-urgent escalations
  - Surface quick wins for motivation
```

---

## 7. Interaction Patterns

### 7.1 Daily Touchpoint Structure

**Morning Planning (05:00-07:00)**

```yaml
input:
  - Calendar for today
  - Yesterday's incomplete items
  - Overnight information arrivals
  - Current energy/mood (if captured)
  - Week context (day in week, TiB status, etc.)

processing:
  - Identify fixed commitments
  - Calculate available deep work time
  - Select tasks aligned with energy and priority
  - Detect potential conflicts or preparation needs

output:
  - Today's recommended focus (1-3 items)
  - Suggested time blocks
  - Preparations needed for upcoming commitments
  - "Almost forgotten" warnings (items aging out)
  - One recommended first step to start the day
```

**Mid-Day Check-ins (flexible, user-initiated)**

```yaml
input:
  - What was planned
  - What user reports happened
  - Any new inputs or changes

processing:
  - Compare plan vs. actual
  - Identify plan adjustments needed
  - Update task statuses

output:
  - Acknowledged progress
  - Adjusted remainder of day (if needed)
  - Next recommended action
```

**Evening Closure (end of work period)**

```yaml
input:
  - Day's activities
  - Incomplete items
  - User reflections (optional)

processing:
  - Generate day summary
  - Update task statuses
  - Identify items for tomorrow
  - Detect patterns worth noting

output:
  - Day summary
  - Wins to acknowledge
  - Items carried forward
  - Brief questions (post-meeting captures if relevant)
  - Optional: observations or patterns noticed
```

### 7.2 Periodic Review Structure

**Weekly Review**

```yaml
focus: "Did I move in the right direction?"
activities:
  - Review completed items
  - Review deferred items (why deferred?)
  - Check goal progress
  - Adjust coming week priorities
  - Capture lessons learned
duration: 30-60 minutes
```

**Monthly Review**

```yaml
focus: "Is my system working?"
activities:
  - Analyze time distribution across roles
  - Review goal progress against monthly targets
  - Identify stuck projects
  - Evaluate assistant effectiveness
  - Adjust processes that aren't working
duration: 60-90 minutes
```

**Quarterly Review**

```yaml
focus: "Are these the right goals?"
activities:
  - Strategic reflection on direction
  - Goal adjustment or retirement
  - Major project evaluation
  - Role balance assessment
  - Significant life decisions review
duration: 2-3 hours
```

**Annual Review**

```yaml
focus: "Where am I heading?"
activities:
  - Vision and values reflection
  - Life role evaluation
  - Major accomplishments recognition
  - Year-ahead intention setting
  - Deep pattern analysis
duration: Half day to full day
```

### 7.3 Command Interface

Suggested command patterns for common interactions:

```
/morgon          - Initiate morning planning
/checkin         - Mid-day status check
/kväll           - Evening closure
/nästa           - Get next recommended action
/status [role]   - Status for specific role or all
/block [task]    - Schedule time for task
/capture [text]  - Quick task/note capture
/prep [meeting]  - Prepare for upcoming meeting
/review          - Initiate appropriate periodic review
/tib             - Activate TiB mode
/energy [level]  - Report current energy level
```

---

## 8. Adaptation Guidelines

### 8.1 Neurotype-Specific Adaptations

The assistant adapts its behavior based on the user's cognitive profile defined in `{{user.neurotype}}`. Common adaptation patterns include:

| Challenge Category | Adaptation Strategy |
|-------------------|---------------------|
| Task initiation difficulty | Provide "smallest first step"; make starting frictionless |
| Working memory limitations | Never require user to remember; externalize everything |
| Context switching cost | Log interruption points; provide rich context on resume |
| Overwhelm susceptibility | Show one thing at a time; hide complexity by default |
| Urgency dependency | Create visibility through salience, not pressure |
| Time perception challenges | Make time visible; use concrete comparisons |
| Emotional sensitivity | Tone must be supportive, never critical or guilt-inducing |

**Profile-Driven Configuration:**

Each user defines their specific challenges and preferred adaptations in their profile. The assistant queries:
- `{{user.neurotype.challenges}}`: List of specific challenges with descriptions
- `{{user.neurotype.challenges.[name].assistant_response}}`: How to adapt for each challenge
- `{{user.neurotype.effective_strategies}}`: Strategies that work well for this user

These adaptations are applied throughout all assistant interactions, from task breakdown to communication style to scheduling suggestions.

### 8.2 Interaction Tone Guidelines

```yaml
always:
  - Supportive and encouraging
  - Non-judgmental about deferrals or changes
  - Concrete and specific
  - Focused on "what next" over "what's wrong"
  - Celebrating small wins

never:
  - Guilt-inducing ("You said you'd do this yesterday")
  - Overwhelming with options
  - Abstract without concrete examples
  - Presumptuous about user's state
  - Dismissive of expressed concerns
```

### 8.3 Graceful Degradation

When incomplete information is available:

```
Prefer action with uncertainty over paralysis waiting for certainty.
Surface uncertainty explicitly: "I'm assuming X; let me know if wrong."
Ask focused questions, never open-ended "what do you need?"
If truly blocked, state clearly what's missing and why it matters.
```

---

## 9. Data Architecture Requirements

### 9.1 Core Data Stores

| Store | Purpose | Format | Example Contents |
|-------|---------|--------|------------------|
| User Profile | Static user attributes | JSON | Roles, values, preferences |
| User State | Dynamic user attributes | Key-value with timestamp | Current energy, focus, mood |
| Task Store | Task lifecycle management | SQLite | Tasks with full metadata |
| Event Log | Activity history | Append-only log | Actions, decisions, outcomes |
| Memory Store | Long-term knowledge | Vector DB + structured | Facts, procedures, episodes |
| Relationship Store | People and connections | Graph or relational | Contacts, history, open items |
| Document Index | File corpus metadata | Search index | Locations, summaries, embeddings |
| Calendar Mirror | Schedule representation | Structured events | Commitments, blocks, availability |

### 9.2 Data Flows

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   INPUTS    │────▶│  PROCESSING │────▶│   OUTPUTS   │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │
      ▼                   ▼                   ▼
 ┌─────────┐        ┌─────────┐        ┌─────────┐
 │ User    │        │ All     │        │ Task    │
 │ Messages│        │ Stores  │        │ Updates │
 │ Calendar│        │ Updated │        │ Calendar│
 │ Email   │        │ in      │        │ Blocks  │
 │ Docs    │        │ Pipeline│        │ Comms   │
 │ Sensors │        │         │        │ Reports │
 └─────────┘        └─────────┘        └─────────┘
```

---

## 10. Implementation Principles

### 10.1 Build Order

Capabilities should be implemented in this sequence:

```
Phase 1: Foundation
  1. User profile (static)
  2. Task capture and basic status
  3. Simple next-step extraction
  4. Basic daily planning

Phase 2: Memory
  5. Activity logging
  6. Document indexing
  7. Semantic memory
  8. Calendar integration

Phase 3: Intelligence
  9. User state modeling
  10. Temporal intelligence
  11. Role-aware filtering
  12. Pattern detection

Phase 4: Integration
  13. Communication management
  14. Relationship tracking
  15. Cross-domain synthesis
  16. Boundary enforcement

Phase 5: Emergence
  17. Strategic guidance
  18. Creative amplification
  19. Wisdom accumulation
  20. Health integration
```

### 10.2 Quality Criteria

For each capability:

| Criterion | Test |
|-----------|------|
| Reduces cognitive load | Does it make user feel less overwhelmed? |
| Activation-focused | Does it help start, not just plan? |
| Appropriately timed | Does it respect user's current state? |
| Minimally invasive | Does it avoid unnecessary interruption? |
| Traceable | Can user understand why it did what it did? |
| Recoverable | Can user easily correct or override? |

### 10.3 Anti-Fragility

The system should degrade gracefully:

```
With all capabilities: Full cognitive augmentation
With partial data: Reduced but functional assistance  
With no history: Basic task management still works
With no calendar: Manual time blocking still works
With no documents: Memory-based assistance still works
```

---

## 11. Success Metrics

### 11.1 Quantitative

| Metric | Target | Measurement |
|--------|--------|-------------|
| Task completion rate | >70% of captured tasks | Completed / Captured |
| Task staleness | <10% over 2 weeks | Count of stale tasks |
| Planning adherence | >50% of planned blocks executed | Actual / Planned |
| Capture-to-action time | <24h for urgent | Time from capture to first action |
| Interruption recovery | <5 min | Time to resume after interruption |

### 11.2 Qualitative

Periodic self-assessment questions:

```
- Do I feel more in control of my commitments?
- Am I starting tasks more easily?
- Can I find information when I need it?
- Does the system anticipate my needs?
- Am I sustainable in my workload?
- Do I trust the system to remember for me?
```

---

## 12. Appendix: Glossary

| Term | Definition |
|------|------------|
| Activation | The act of starting a task; the primary challenge addressed |
| Role | A defined area of responsibility (A01-A10) |
| Next Step | The single immediate action for a task or project |
| Block | A scheduled period of time for focused work |
| Capture | Recording a task, note, or thought for later processing |
| Staleness | When a task has sat too long without progress |
| TiB | Tjänsteperson i Beredskap (Duty Officer) |
| Scope Creep | Work expanding beyond defined responsibilities |
| Cognitive Load | Mental effort required to manage information |
| Time Debt | Accumulated delay cost of deferred items |

---

## Change Log

| Date | Version | Change |
|------|---------|--------|
| 2025-12-13 | 1.2 | Format: Context-filer ändrade från YAML till JSON |
| 2025-12-13 | 1.1 | Depersonalization: All user-specific information moved to `.system/context/personal-profile.json`. Template variables introduced. "AuDHD-Specific" generalized to "Neurotype-Specific". |
| 2025-12-13 | 1.0 | Initial complete specification |

---

*End of Specification*
