import type { Habit } from '@/lib/types';
import { getRelativeTime } from '@/lib/utils';
import { HabitItem } from './HabitItem';
import { AddHabitRow } from './AddHabitRow';

interface HabitsSectionProps {
  habits: Habit[];
  currentHour: number;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onChangeWindow: (id: string, window: string) => void;
  onUpdateText: (id: string, text: string) => void;
  onAddReflection: (id: string, reflection: string) => void;
  onAddHabit: (text: string, timeWindow: string) => void;
}

export function HabitsSection({
  habits,
  currentHour,
  onToggle,
  onDelete,
  onChangeWindow,
  onUpdateText,
  onAddReflection,
  onAddHabit,
}: HabitsSectionProps) {
  const completedHabitsToday = habits.filter((h) => h.completedToday).length;
  const totalHabits = habits.length;

  // Sort habits by time window
  const windowOrder = ['morning', 'midday', 'afternoon', 'evening', 'night'];
  const sortedHabits = [...habits].sort(
    (a, b) => windowOrder.indexOf(a.timeWindow) - windowOrder.indexOf(b.timeWindow)
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200/80 overflow-hidden">
      <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <svg
              className="w-3.5 h-3.5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
          <span className="font-medium text-stone-800 text-sm">Habits</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-base font-semibold text-emerald-600">{completedHabitsToday}</span>
          <span className="text-stone-300">/</span>
          <span className="text-stone-400 text-sm">{totalHabits}</span>
        </div>
      </div>
      <div className="px-5 divide-y divide-stone-50">
        {sortedHabits.map((habit) => {
          const relativeTime = getRelativeTime(habit.timeWindow, currentHour, habit.completedToday);
          return (
            <HabitItem
              key={habit.id}
              habit={habit}
              currentHour={currentHour}
              relativeTime={relativeTime}
              onToggle={onToggle}
              onDelete={onDelete}
              onChangeWindow={onChangeWindow}
              onUpdateText={onUpdateText}
              onAddReflection={onAddReflection}
            />
          );
        })}
      </div>
      <AddHabitRow onAdd={onAddHabit} />
    </div>
  );
}
