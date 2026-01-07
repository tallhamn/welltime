# System Specification

## Overview

A local-first productivity application with two main sections (Habits and Tasks), an LLM-powered planning assistant, and Markdown-based persistence.

---

## Data Model

### Habit

```typescript
interface Habit {
  id: string;                    // Unique identifier
  text: string;                  // Habit name/description
  timeWindow: TimeWindow;        // When this habit is typically done
  streak: number;                // Consecutive days completed
  completedToday: boolean;       // Whether completed in current day
  reflections: string[];         // Array of past reflections (most recent last)
}

type TimeWindow = 'morning' | 'midday' | 'afternoon' | 'evening' | 'night';

// Time window definitions:
// morning:   6:00 - 11:00
// midday:    11:00 - 14:00
// afternoon: 14:00 - 17:00
// evening:   17:00 - 21:00
// night:     21:00 - 24:00
```

### Task

```typescript
interface Task {
  id: string;                    // Unique identifier
  text: string;                  // Task name/description
  completed: boolean;            // Completion status
  completedAt: string | null;    // ISO date string (YYYY-MM-DD) or null
  reflection: string | null;     // Optional reflection on completion
  children: Task[];              // Subtasks (recursive, arbitrary depth)
}
```

---

## File Storage

### Directory Structure

```
~/.habits-app/
├── current.md              # Current state in Markdown
├── data.json               # Current state in JSON (for fast loading)
└── history/
    ├── 2025-01-07T10-30-00_llm-action.md
    ├── 2025-01-07T09-00-00_auto.md
    └── ...
```

### Markdown Format

```markdown
# Habits

## [Habit Name]
- Window: [timeWindow]
- Streak: [number]
- Completed today: [yes|no]
- Reflections:
  - [reflection text]
  - [reflection text]

---

# Tasks

## [Top-level Task Name]
- Status: completed ([YYYY-MM-DD])    // Only if completed
> [reflection text]                    // Only if has reflection
- [ ] [Subtask text]
- [x] [Completed subtask] ([YYYY-MM-DD])
  > [subtask reflection]
  - [ ] [Nested subtask]               // Arbitrary depth via indentation
```

### History/Snapshots

Snapshots are created:
1. Before any LLM-initiated action
2. Periodically (e.g., hourly or on app close)
3. On user request

Filename format: `{ISO-timestamp}_{reason}.md`

Keep last 20-50 snapshots, prune older ones.

---

## User Interface

### Layout

```
┌─────────────────────────────────────────────────┐
│  Today                              [time] [Plan]│
│  [Coach message line]                            │
├─────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐│
│  │ 🔄 Habits                            3/5    ││
│  │ ☐ Morning workout          🔥 12    [now]  ││
│  │ ☑ Review daily goals       🔥 5            ││
│  │ ☐ Focused coding block     🔥 8    [later] ││
│  │ + Add habit                                 ││
│  └─────────────────────────────────────────────┘│
│                                                  │
│  ──────────────── Tasks ─────────────────────   │
│                                                  │
│  ┌─────────────────────────────────────────────┐│
│  │ 📋 Tasks                                    ││
│  │ [Search... e.g. "done this week"]          ││
│  │                                             ││
│  │ ☐ Hire VP of Sales                     [+] ││
│  │   │ ☑ Define role requirements             ││
│  │   │ ☐ Reach out to network             [+] ││
│  │   │ ☐ Contact 3 recruiters             [+] ││
│  │ ☐ Guest house network                  [+] ││
│  │   │ ...                                    ││
│  │                                             ││
│  │ + Add task                                  ││
│  │ View completed tasks →                      ││
│  └─────────────────────────────────────────────┘│
│                                                  │
│  [Export as Markdown]                            │
└─────────────────────────────────────────────────┘
```

### Plan Panel (slides in from right)

```
┌──────────────────────────────┐
│ ○ Planning              [✕]  │
│   Break down & prioritize    │
├──────────────────────────────┤
│                              │
│  [Assistant message]         │
│                              │
│     [User message]           │
│                              │
│  [Assistant response]        │
│  [Action Button] [Action]    │
│                              │
│  ...                         │
│                              │
├──────────────────────────────┤
│ [What do you want to work on?]│
│ Try: "Break down the hiring  │
│ task"                        │
└──────────────────────────────┘
```

### Undo Bar (fixed bottom, appears after LLM actions)

```
┌─────────────────────────────────────────────────┐
│  Changes applied by Plan    [Undo]    [✕]       │
└─────────────────────────────────────────────────┘
```

---

## Behaviors

### Habit Completion Flow

1. User clicks checkbox on habit
2. Habit marked complete, streak incremented
3. Reflection prompt appears (optional)
4. User types reflection or clicks Skip
5. If entered, reflection added to habit's reflections array
6. Coach message updates to reinforcement mode ("I keep stacking...")
7. After 4 seconds, returns to coaching mode

### Task Completion Flow

1. User clicks checkbox on task
2. Task marked complete with today's date
3. Reflection prompt appears (optional)
4. User types reflection or clicks Skip
5. If entered, reflection stored on task
6. UI updates (task fades or hides based on filter)

### Task Search/Filter

Default view: Shows only incomplete tasks (hierarchical)

Search queries interpreted by LLM:
- "done this week" → completed tasks in last 7 days
- "hiring" → tasks matching topic, grouped by parent
- "all" → everything
- "reflections" → tasks with reflections

Results can be:
- Flat list (for time-based queries)
- Grouped/hierarchical (for topic queries)

### Plan Panel Interactions

LLM has full context:
- All habits with streaks, time windows, reflections
- All tasks with completion status, subtasks, reflections
- Current time/time window
- What was just completed (if any)

Can respond with actions:
- `add_task`: Add new top-level task
- `add_subtask`: Add subtask to existing task
- `complete_task`: Mark task complete
- `filter_tasks`: Apply search filter
- `restructure_tasks`: Replace task tree (major changes)

Every action creates undo snapshot first.

### Coach Messages

Two modes:
1. **Coaching (app voice)**: "Focused coding block is up. You know what to do."
2. **Reinforcing (self-talk)**: "12 days. I keep stacking."

Switches to reinforcing for ~4 seconds after completing a habit, then returns to coaching.

Message considers:
- Current time window
- Which habits are due
- What was just completed
- Streak lengths
- Overall progress

---

## First Launch Setup

On first launch, app should:

1. Prompt for storage location (default: `~/.habits-app/`)
2. Create directory structure
3. Initialize with example habits and tasks (or empty)
4. Connect to Claude API (user provides API key, stored securely)
5. Show brief onboarding explaining Habits vs Tasks concept

---

## API Integration

### Claude API Usage

Used for:
1. Plan panel conversations
2. Task search/filter interpretation
3. Reflection pattern analysis ("What have I learned?")

Context sent with each request:
- Full habits array
- Full tasks array
- Current time
- Conversation history (for Plan panel)

System prompt should emphasize:
- User's reflections are primary source of personalization
- Suggest concrete actions, not vague advice
- Respect user's existing task structure
- Create undo-able atomic changes

### Rate Limiting / Cost

- Cache search interpretations for repeated queries
- Debounce Plan panel input
- Consider local/smaller model for simple operations

---

## Technical Considerations

### Daily Reset

Habits' `completedToday` should reset at midnight (or user-configured time).

Options:
- Check on app open
- Background timer if app stays open
- Store last reset date, compare on load

### Sync Conflicts

If using file sync (Dropbox, iCloud):
- Last-write-wins is acceptable for single-user
- Could add conflict detection via checksums
- History snapshots provide recovery path

### Performance

- JSON file for fast load, Markdown for human readability
- Keep both in sync on every save
- Lazy-load history only when needed
- Virtualize long task lists if they grow large

---

## Future Considerations

Not in v1, but worth designing for:

- **Habit streaks visualization**: Calendar heatmap, "23 of last 30 days"
- **Habit stacking**: Chain habits in sequence
- **Notifications**: Coach messages as system notifications
- **Tags/contexts**: Filter by context (work, home, etc.)
- **Recurring tasks**: Tasks that regenerate on schedule
- **Time tracking**: Optional duration logging
- **Multiple files**: Separate work/personal into different Markdown files
