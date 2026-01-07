import type { Habit } from '@/lib/types';
import { getHoursUntilAvailable, isHabitAvailable } from '@/lib/utils';
import { HabitItem } from './HabitItem';
import { AddHabitRow } from './AddHabitRow';

interface HabitsSectionProps {
  habits: Habit[];
  currentHour: number;
  searchQuery: string;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateInterval: (id: string, intervalHours: number) => void;
  onUpdateText: (id: string, text: string) => void;
  onAddReflection: (id: string, reflection: string) => void;
  onAddHabit: (text: string, intervalHours: number) => void;
}

export function HabitsSection({
  habits,
  currentHour: _currentHour,
  searchQuery,
  onToggle,
  onDelete,
  onUpdateInterval,
  onUpdateText,
  onAddReflection,
  onAddHabit,
}: HabitsSectionProps) {
  // Filter habits by search query
  const filteredHabits = habits.filter((habit) => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return habit.text.toLowerCase().includes(lowerQuery) ||
           habit.reflections.some((r) => r.toLowerCase().includes(lowerQuery));
  });

  // Group habits by availability
  const whenYouCan: Habit[] = [];
  const in1h: Habit[] = [];
  const in6h: Habit[] = [];
  const in1d: Habit[] = [];

  filteredHabits.forEach((habit) => {
    const hoursUntil = getHoursUntilAvailable(habit.lastCompleted, habit.repeatIntervalHours);

    if (hoursUntil <= 0) {
      whenYouCan.push(habit);
    } else if (hoursUntil <= 6) {
      in1h.push(habit);
    } else if (hoursUntil <= 24) {
      in6h.push(habit);
    } else {
      in1d.push(habit);
    }
  });

  const totalCompleted = habits.filter((h) =>
    h.lastCompleted && !isHabitAvailable(h.lastCompleted, h.repeatIntervalHours)
  ).length;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
        <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Habits</span>
        <span className="text-sm text-stone-400">
          {totalCompleted} of {habits.length}
        </span>
      </div>
      <div className="px-5">
        {/* When you can */}
        {whenYouCan.length > 0 && (
          <div>
            <div className="py-2 text-xs text-stone-400">When you can</div>
            <div className="divide-y divide-stone-50">
              {whenYouCan.map((habit) => (
                <HabitItem
                  key={habit.id}
                  habit={habit}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  onUpdateInterval={onUpdateInterval}
                  onUpdateText={onUpdateText}
                  onAddReflection={onAddReflection}
                />
              ))}
            </div>
          </div>
        )}

        {/* >1h */}
        {in1h.length > 0 && (
          <div>
            <div className="py-2 text-xs text-stone-400">&gt;1h</div>
            <div className="divide-y divide-stone-50">
              {in1h.map((habit) => (
                <HabitItem
                  key={habit.id}
                  habit={habit}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  onUpdateInterval={onUpdateInterval}
                  onUpdateText={onUpdateText}
                  onAddReflection={onAddReflection}
                />
              ))}
            </div>
          </div>
        )}

        {/* >6h */}
        {in6h.length > 0 && (
          <div>
            <div className="py-2 text-xs text-stone-400">&gt;6h</div>
            <div className="divide-y divide-stone-50">
              {in6h.map((habit) => (
                <HabitItem
                  key={habit.id}
                  habit={habit}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  onUpdateInterval={onUpdateInterval}
                  onUpdateText={onUpdateText}
                  onAddReflection={onAddReflection}
                />
              ))}
            </div>
          </div>
        )}

        {/* >1d */}
        {in1d.length > 0 && (
          <div>
            <div className="py-2 text-xs text-stone-400">&gt;1d</div>
            <div className="divide-y divide-stone-50">
              {in1d.map((habit) => (
                <HabitItem
                  key={habit.id}
                  habit={habit}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  onUpdateInterval={onUpdateInterval}
                  onUpdateText={onUpdateText}
                  onAddReflection={onAddReflection}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      <AddHabitRow onAdd={onAddHabit} />
    </div>
  );
}
