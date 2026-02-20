import { useState, useEffect, useRef, useCallback } from 'react';
import type { Habit } from '@clawkeeper/shared/src/types';
import { getHabitMarkerHours } from '@clawkeeper/shared/src/utils';

interface HabitTimelineProps {
  habits: Habit[];
  currentHour: number;
  highlightHabitId?: string | null;
  onHoverHabit?: (id: string | null) => void;
  onAdjustPreferredHour?: (habitId: string, newHour: number) => void;
  onAdjustCompletionTime?: (habitId: string, timestamp: string, newHour: number) => void;
}

interface TimelineEntry {
  hour: number;
  habitId: string;
  icon: string;
  label: string;
  kind: 'logged' | 'planned' | 'planned-past';
  sourceTimestamp?: string;
}

function snapToQuarterHour(hour: number): number {
  return Math.round(hour * 4) / 4;
}

function formatHourMinute(hour: number): string {
  const h = Math.floor(hour) % 24;
  const m = Math.round((hour - Math.floor(hour)) * 60);
  const suffix = h >= 12 ? 'pm' : 'am';
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? `${display}${suffix}` : `${display}:${String(m).padStart(2, '0')}${suffix}`;
}

function computeEntries(habits: Habit[], nowHour: number): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  const todayStr = new Date().toDateString();

  for (const habit of habits) {
    if (habit.preferredHour == null) continue;
    const icon = habit.icon ?? '◆';

    // Collect all of today's completions from history
    const todayCompletions: { hour: number; timestamp: string }[] = [];
    for (const ts of (habit.completionHistory || [])) {
      const d = new Date(ts);
      if (d.toDateString() === todayStr) {
        todayCompletions.push({ hour: d.getHours() + d.getMinutes() / 60, timestamp: ts });
      }
    }
    // Fallback: if no history but lastCompleted is today, use that
    if (todayCompletions.length === 0 && habit.lastCompleted) {
      const d = new Date(habit.lastCompleted);
      if (d.toDateString() === todayStr) {
        todayCompletions.push({ hour: d.getHours() + d.getMinutes() / 60, timestamp: habit.lastCompleted });
      }
    }

    // Add logged entries for each completion today
    for (const { hour, timestamp } of todayCompletions) {
      entries.push({
        hour,
        habitId: habit.id,
        icon,
        label: habit.text,
        kind: 'logged',
        sourceTimestamp: timestamp,
      });
    }

    // Scheduled markers for the full day
    const hasCompletionToday = todayCompletions.length > 0;
    for (const hour of getHabitMarkerHours(habit)) {
      // Skip past scheduled hours if there's a logged completion (avoid clutter)
      if (hasCompletionToday && hour < nowHour) continue;
      entries.push({
        hour,
        habitId: habit.id,
        icon,
        label: habit.text,
        kind: hour >= nowHour ? 'planned' : 'planned-past',
      });
    }
  }

  entries.sort((a, b) => a.hour - b.hour);
  return entries;
}

interface LayoutItem {
  entry: TimelineEntry;
  pct: number;
  fontSize: number;
}

/** Nudge overlapping entries apart; logged entries are pinned at their actual time. */
function layoutEntries(entries: TimelineEntry[]): LayoutItem[] {
  if (entries.length === 0) return [];

  const BASE_FONT = 11;
  const MIN_FONT = 6;
  const BASE_GAP = 2.8; // minimum % gap between centers at base font size

  // Start with natural positions
  let items: LayoutItem[] = entries.map((e) => ({
    entry: e,
    pct: (e.hour / 24) * 100,
    fontSize: BASE_FONT,
  }));

  // Nudge: push overlapping entries to the right, but never move logged entries
  function nudge(gap: number) {
    for (let i = 1; i < items.length; i++) {
      if (items[i].pct - items[i - 1].pct < gap) {
        if (items[i].entry.kind === 'logged') {
          // Logged entry is pinned — push the previous entry left instead if possible
          // (skip: just let them overlap rather than displace a real completion)
          continue;
        }
        items[i].pct = items[i - 1].pct + gap;
      }
    }
  }

  nudge(BASE_GAP);

  // If last entry overflows, shrink gap & font to fit
  const last = items[items.length - 1];
  if (last.pct > 98) {
    const firstPct = (entries[0].hour / 24) * 100;
    const available = 98 - firstPct;
    const neededGaps = entries.length - 1;
    const newGap = neededGaps > 0 ? Math.min(BASE_GAP, available / neededGaps) : BASE_GAP;
    const scale = Math.max(newGap / BASE_GAP, MIN_FONT / BASE_FONT);
    const fontSize = Math.max(MIN_FONT, Math.round(BASE_FONT * scale));

    // Reset to natural positions with new font
    items = entries.map((e) => ({
      entry: e,
      pct: (e.hour / 24) * 100,
      fontSize,
    }));
    nudge(newGap);
  }

  return items;
}

function getFractionalHour(): number {
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60;
}

interface DragData {
  entry: TimelineEntry;
  startX: number;
  startHour: number;
  containerRect: DOMRect;
}

export function HabitTimeline({ habits, highlightHabitId, onHoverHabit, onAdjustPreferredHour, onAdjustCompletionTime }: HabitTimelineProps) {
  const [nowHour, setNowHour] = useState(getFractionalHour);
  const [timelineHovered, setTimelineHovered] = useState(false);

  // Drag state — refs for handlers, state only for the snapped hour (to trigger render)
  const dragRef = useRef<DragData | null>(null);
  const dragHourRef = useRef<number | null>(null);
  const [dragHourForRender, setDragHourForRender] = useState<number | null>(null);
  const [dragHabitId, setDragHabitId] = useState<string | null>(null);
  const [dragKind, setDragKind] = useState<'logged' | 'planned' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update the cursor every 30 seconds so it moves smoothly through the day
  useEffect(() => {
    const interval = setInterval(() => setNowHour(getFractionalHour()), 30000);
    return () => clearInterval(interval);
  }, []);

  const isDragging = dragRef.current !== null;

  const handlePointerDown = useCallback((e: React.PointerEvent, entry: TimelineEntry) => {
    // Don't allow dragging planned-past (missed) entries
    if (entry.kind === 'planned-past') return;
    // Need callbacks to be useful
    if (!onAdjustPreferredHour && !onAdjustCompletionTime) return;

    const container = containerRef.current;
    if (!container) return;

    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const rect = container.getBoundingClientRect();
    dragRef.current = {
      entry,
      startX: e.clientX,
      startHour: entry.hour,
      containerRect: rect,
    };
    dragHourRef.current = entry.hour;
    setDragHourForRender(entry.hour);
    setDragHabitId(entry.habitId);
    setDragKind(entry.kind);
  }, [onAdjustPreferredHour, onAdjustCompletionTime]);

  useEffect(() => {
    function handlePointerMove(e: PointerEvent) {
      const drag = dragRef.current;
      if (!drag) return;

      const { containerRect } = drag;
      // Convert clientX to fractional hour
      const relX = e.clientX - containerRect.left;
      const pct = Math.max(0, Math.min(1, relX / containerRect.width));
      let newHour = snapToQuarterHour(pct * 24);

      // Clamp logged entries to current time (can't drag into the future)
      if (drag.entry.kind === 'logged') {
        const now = getFractionalHour();
        newHour = Math.min(newHour, snapToQuarterHour(now));
      }

      // Clamp to [0, 24)
      newHour = Math.max(0, Math.min(23.75, newHour));

      if (newHour !== dragHourRef.current) {
        dragHourRef.current = newHour;
        setDragHourForRender(newHour);
      }
    }

    function handlePointerUp() {
      const drag = dragRef.current;
      const snappedHour = dragHourRef.current;
      if (!drag || snappedHour == null) {
        dragRef.current = null;
        dragHourRef.current = null;
        setDragHourForRender(null);
        setDragHabitId(null);
        setDragKind(null);
        return;
      }

      const delta = snappedHour - drag.startHour;

      if (Math.abs(delta) > 0.01) {
        if (drag.entry.kind === 'logged' && drag.entry.sourceTimestamp && onAdjustCompletionTime) {
          onAdjustCompletionTime(drag.entry.habitId, drag.entry.sourceTimestamp, snappedHour);
        } else if (drag.entry.kind === 'planned' && onAdjustPreferredHour) {
          // Find the habit's current preferredHour and apply the delta with wrapping
          const habit = habits.find(h => h.id === drag.entry.habitId);
          if (habit && habit.preferredHour != null) {
            const newPref = ((habit.preferredHour + delta) % 24 + 24) % 24;
            onAdjustPreferredHour(drag.entry.habitId, snapToQuarterHour(newPref));
          }
        }
      }

      dragRef.current = null;
      dragHourRef.current = null;
      setDragHourForRender(null);
      setDragHabitId(null);
      setDragKind(null);
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [habits, onAdjustPreferredHour, onAdjustCompletionTime]);

  const entries = computeEntries(habits, nowHour);

  if (entries.length === 0) return null;

  const nowPct = (nowHour / 24) * 100;
  const hasHighlight = highlightHabitId != null;

  // Compute drag delta for shifting all planned entries of the dragged habit
  const dragDelta = (isDragging && dragKind === 'planned' && dragHourForRender != null && dragRef.current)
    ? dragHourForRender - dragRef.current.startHour
    : 0;

  return (
    <div
      className="px-4 border-b border-tokyo-border/30 flex items-center gap-1.5"
      onMouseEnter={() => setTimelineHovered(true)}
      onMouseLeave={() => { setTimelineHovered(false); onHoverHabit?.(null); }}
    >
      <svg className="w-5 h-5 flex-shrink-0 text-tokyo-text-dim self-end" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" title="Morning">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
      </svg>
      <div ref={containerRef} className="relative flex-1 h-7 overflow-visible">
        {/* Playhead — FCP-style triangle + vertical line, flush to top of container */}
        <div
          className="absolute z-20 -translate-x-1/2 flex flex-col items-center pointer-events-none"
          style={{ left: `${nowPct}%`, top: 0, bottom: 0 }}
        >
          <div
            className="w-0 h-0 flex-shrink-0"
            style={{
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: '5px solid #565a6e',
            }}
          />
          <div className="w-px flex-1 bg-tokyo-text-muted/50" />
        </div>
        {/* Entries — laid out to avoid overlaps */}
        {layoutEntries(entries).map(({ entry, pct, fontSize }, idx) => {
          const isTargeted = hasHighlight && entry.habitId === highlightHabitId;
          const isMissed = entry.kind === 'planned-past';
          const isDraggable = entry.kind !== 'planned-past' && (onAdjustPreferredHour || onAdjustCompletionTime);

          // During drag: is this the dragged entry or a sibling planned entry?
          const isBeingDragged = isDragging && dragHabitId === entry.habitId
            && dragRef.current?.entry.hour === entry.hour
            && dragRef.current?.entry.kind === entry.kind;
          const isSiblingShift = isDragging && dragKind === 'planned'
            && dragHabitId === entry.habitId && entry.kind === 'planned' && !isBeingDragged;

          // Compute display position
          let displayPct = pct;
          if (isBeingDragged && dragHourForRender != null) {
            displayPct = (dragHourForRender / 24) * 100;
          } else if (isSiblingShift) {
            const shiftedHour = ((entry.hour + dragDelta) % 24 + 24) % 24;
            displayPct = (shiftedHour / 24) * 100;
          }

          const colorful = !isMissed && !isDragging && (isTargeted || (hasHighlight ? false : timelineHovered));

          return (
            <div
              key={`${entry.kind}-${entry.habitId}-${entry.hour}-${idx}`}
              className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 select-none ${
                isBeingDragged || isSiblingShift ? '' : 'transition-all duration-150'
              } ${
                colorful ? 'opacity-100' : isMissed ? 'opacity-20' : isDragging && !isBeingDragged && !isSiblingShift ? 'opacity-30' : 'opacity-40'
              } ${!colorful && !isBeingDragged && !isSiblingShift ? 'grayscale' : ''} ${
                isBeingDragged ? 'z-30 scale-150 opacity-100' : isTargeted ? 'z-30 scale-150' : 'z-10'
              } ${isDraggable ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'}`}
              style={{
                left: `${displayPct}%`,
                fontSize: isBeingDragged || isTargeted ? `${fontSize + 3}px` : `${fontSize}px`,
                lineHeight: 1,
              }}
              title={isDragging ? undefined : `${entry.label} — ${entry.kind === 'logged' ? 'done' : entry.kind === 'planned-past' ? 'missed' : 'planned'} ${formatHour(entry.hour)}`}
              onMouseEnter={() => { if (!isDragging) onHoverHabit?.(entry.habitId); }}
              onMouseLeave={() => { if (!isDragging) onHoverHabit?.(null); }}
              onPointerDown={(e) => handlePointerDown(e, entry)}
            >
              {entry.icon}
              {/* Tooltip above the dragged entry */}
              {isBeingDragged && dragHourForRender != null && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 bg-tokyo-surface-alt border border-tokyo-border rounded text-[10px] text-tokyo-text whitespace-nowrap pointer-events-none">
                  {formatHourMinute(dragHourForRender)}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <svg className="w-5 h-5 flex-shrink-0 text-tokyo-text-dim self-end" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" title="Night">
        <path d="M13 9.5A5.5 5.5 0 0 1 6.5 3 5.5 5.5 0 1 0 13 9.5z" />
      </svg>
    </div>
  );
}

function formatHour(hour: number): string {
  const h = Math.floor(hour) % 24;
  const suffix = h >= 12 ? 'pm' : 'am';
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}${suffix}`;
}
