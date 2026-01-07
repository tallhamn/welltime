import { useState } from 'react';
import type { Habit } from '@/lib/types';
import { isHabitAvailable, formatInterval } from '@/lib/utils';

interface HabitItemProps {
  habit: Habit;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateInterval: (id: string, intervalHours: number) => void;
  onUpdateText: (id: string, text: string) => void;
  onAddReflection: (id: string, reflection: string) => void;
}

type IntervalUnit = 'hours' | 'days' | 'weeks';

export function HabitItem({
  habit,
  onToggle,
  onDelete,
  onUpdateInterval,
  onUpdateText,
  onAddReflection,
}: HabitItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(habit.text);
  const [showReflectionInput, setShowReflectionInput] = useState(false);
  const [reflectionText, setReflectionText] = useState('');
  const [isEditingInterval, setIsEditingInterval] = useState(false);
  const [intervalValue, setIntervalValue] = useState(1);
  const [intervalUnit, setIntervalUnit] = useState<IntervalUnit>('days');

  const available = isHabitAvailable(habit.lastCompleted, habit.repeatIntervalHours);

  const getIntervalParts = (hours: number): { value: number; unit: IntervalUnit } => {
    if (hours % (24 * 7) === 0) {
      return { value: hours / (24 * 7), unit: 'weeks' };
    } else if (hours % 24 === 0) {
      return { value: hours / 24, unit: 'days' };
    } else {
      return { value: hours, unit: 'hours' };
    }
  };

  const getHoursFromInterval = (value: number, unit: IntervalUnit): number => {
    switch (unit) {
      case 'hours':
        return value;
      case 'days':
        return value * 24;
      case 'weeks':
        return value * 24 * 7;
    }
  };

  const handleStartEditingInterval = () => {
    const parts = getIntervalParts(habit.repeatIntervalHours);
    setIntervalValue(parts.value);
    setIntervalUnit(parts.unit);
    setIsEditingInterval(true);
  };

  const handleSaveInterval = () => {
    const hours = getHoursFromInterval(intervalValue, intervalUnit);
    onUpdateInterval(habit.id, hours);
    setIsEditingInterval(false);
  };

  const handleCancelInterval = () => {
    setIsEditingInterval(false);
  };

  const handleSave = () => {
    if (editText.trim()) {
      onUpdateText(habit.id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleToggle = () => {
    onToggle(habit.id);
    if (available) {
      setShowReflectionInput(true);
    }
  };

  const handleSaveReflection = () => {
    if (reflectionText.trim()) {
      onAddReflection(habit.id, reflectionText.trim());
    }
    setShowReflectionInput(false);
    setReflectionText('');
  };

  const handleSkipReflection = () => {
    setShowReflectionInput(false);
    setReflectionText('');
  };

  return (
    <div className={`group py-2 ${!available ? 'opacity-40' : ''}`}>
      <div className="flex items-center gap-3">
        <button
          onClick={handleToggle}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 cursor-pointer
            ${
              !available
                ? 'bg-kyoto-red border-kyoto-red text-white hover:opacity-80'
                : 'border-stone-300 hover:border-stone-400 bg-white'
            }`}
        >
          {!available && (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') {
                  setEditText(habit.text);
                  setIsEditing(false);
                }
              }}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-kyoto-red text-sm"
              autoFocus
            />
          ) : (
            <span
              onClick={() => setIsEditing(true)}
              className={`text-stone-700 cursor-text hover:text-stone-600 ${!available ? 'line-through opacity-50' : ''}`}
            >
              {habit.text}
            </span>
          )}
          <div className="flex items-center gap-1 mt-0.5">
            {isEditingInterval ? (
              <div className="flex items-center gap-1">
                <span className="text-xs text-stone-400">every</span>
                <input
                  type="number"
                  min="1"
                  value={intervalValue}
                  onChange={(e) => setIntervalValue(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-12 px-1 py-0.5 text-xs bg-white border border-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-kyoto-red"
                  autoFocus
                />
                <select
                  value={intervalUnit}
                  onChange={(e) => setIntervalUnit(e.target.value as IntervalUnit)}
                  className="px-1 py-0.5 text-xs bg-white border border-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-kyoto-red"
                >
                  <option value="hours">hours</option>
                  <option value="days">days</option>
                  <option value="weeks">weeks</option>
                </select>
                <button
                  onClick={handleSaveInterval}
                  className="px-2 py-0.5 text-xs bg-kyoto-red text-white rounded hover:opacity-90"
                >
                  Save
                </button>
                <button
                  onClick={handleCancelInterval}
                  className="px-2 py-0.5 text-xs text-stone-500 hover:text-stone-700"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <span
                onClick={handleStartEditingInterval}
                className="text-xs text-stone-400 cursor-pointer hover:text-stone-600"
              >
                every {formatInterval(habit.repeatIntervalHours)}
              </span>
            )}
            {habit.reflections && habit.reflections.length > 0 && (
              <>
                <span className="text-stone-200">·</span>
                <span className="text-xs text-stone-500">
                  {habit.reflections.length} reflection{habit.reflections.length > 1 ? 's' : ''}
                </span>
              </>
            )}
          </div>
        </div>

        {habit.streak > 0 && (
          <div className="text-xs text-stone-400 tabular-nums">
            {habit.streak}d
          </div>
        )}

        <button
          onClick={() => onDelete(habit.id)}
          className="p-1.5 text-stone-200 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Reflection input after completing */}
      {showReflectionInput && (
        <div className="mt-3 ml-8 p-3 bg-stone-50 rounded-lg border border-stone-200">
          <p className="text-xs text-stone-600 mb-2 font-medium">Any reflection? (optional)</p>
          <textarea
            value={reflectionText}
            onChange={(e) => setReflectionText(e.target.value)}
            placeholder="What worked today? Anything to remember?"
            className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-kyoto-red resize-none"
            rows={2}
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={handleSkipReflection}
              className="px-3 py-1 text-xs text-stone-600 hover:bg-stone-50 rounded transition-colors"
            >
              Skip
            </button>
            <button
              onClick={handleSaveReflection}
              className="px-4 py-2 text-xs bg-kyoto-red text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
