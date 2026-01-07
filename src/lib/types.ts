// Time window types
export type TimeWindow = 'morning' | 'midday' | 'afternoon' | 'evening' | 'night';

export interface TimeWindowDefinition {
  label: string;
  start: number;  // Hour (0-23)
  end: number;    // Hour (0-23)
  icon: string;
}

export const TIME_WINDOWS: Record<TimeWindow, TimeWindowDefinition> = {
  morning: { label: 'Morning', start: 6, end: 11, icon: '🌅' },
  midday: { label: 'Midday', start: 11, end: 14, icon: '☀️' },
  afternoon: { label: 'Afternoon', start: 14, end: 17, icon: '🌤' },
  evening: { label: 'Evening', start: 17, end: 21, icon: '🌆' },
  night: { label: 'Night', start: 21, end: 24, icon: '🌙' },
};

// Habit model
export interface Habit {
  id: string;
  text: string;
  repeatIntervalHours: number; // How often the habit repeats (default: 24)
  lastCompleted: string | null; // ISO timestamp of when it was last completed
  streak: number;
  reflections: string[];
}

// Task model (recursive for subtasks)
export interface Task {
  id: string;
  text: string;
  completed: boolean;
  completedAt: string | null;  // ISO date string (YYYY-MM-DD)
  reflection: string | null;
  children: Task[];
}

// Application state
export interface AppState {
  habits: Habit[];
  tasks: Task[];
}

// History snapshot
export interface Snapshot {
  timestamp: string;  // ISO timestamp
  reason: string;     // 'llm-action', 'auto', 'user-request'
  markdown: string;
  data: AppState;
}

// LLM Action types
export type LLMActionType =
  | 'add_task'
  | 'add_subtask'
  | 'complete_task'
  | 'filter_tasks'
  | 'restructure_tasks';

export interface LLMAction {
  type: LLMActionType;
  text?: string;
  parentText?: string;
  parentId?: string;
  taskText?: string;
  query?: string;
  newTasks?: Task[];
  label?: string; // Button label like "Add these subtasks"
}

// Task filter results
export interface TaskFilterResult {
  tasks: Task[];
  groupedTasks: Task[] | null;
  description: string;
  count: number;
  showReflections?: boolean;
}

// Relative time indicators for habits
export type RelativeTimeState = 'future' | 'upcoming' | 'current' | 'past';

export interface RelativeTime {
  text: string;
  state: RelativeTimeState;
}
