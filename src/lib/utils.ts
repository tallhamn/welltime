import type { TimeWindow, RelativeTime } from './types';
import { TIME_WINDOWS } from './types';

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

/**
 * Get current time window based on hour (0-23)
 */
export function getCurrentWindow(hour: number): TimeWindow {
  for (const [key, window] of Object.entries(TIME_WINDOWS)) {
    if (hour >= window.start && hour < window.end) {
      return key as TimeWindow;
    }
  }
  return 'morning';
}

/**
 * Get relative time indicator for a habit
 */
export function getRelativeTime(
  windowKey: TimeWindow,
  currentHour: number,
  completedToday: boolean
): RelativeTime | null {
  if (completedToday) return null;

  const window = TIME_WINDOWS[windowKey];

  if (currentHour < window.start) {
    const hoursUntil = window.start - currentHour;
    if (hoursUntil <= 1) return { text: 'coming up', state: 'upcoming' };
    if (hoursUntil <= 3) return { text: `~${Math.round(hoursUntil)}h away`, state: 'upcoming' };
    return { text: 'later', state: 'future' };
  } else if (currentHour >= window.start && currentHour < window.end) {
    return { text: 'now', state: 'current' };
  } else {
    const hoursPast = currentHour - window.end;
    if (hoursPast <= 2) return { text: 'still open', state: 'past' };
    return { text: 'earlier', state: 'past' };
  }
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Format date for display
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'yesterday';
  } else {
    return dateStr;
  }
}

/**
 * Check if we need to reset habits for a new day
 */
export function shouldResetHabits(lastResetDate: string | null): boolean {
  if (!lastResetDate) return true;
  return lastResetDate !== getTodayDate();
}
