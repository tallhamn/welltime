import { useState } from 'react';

interface AddHabitRowProps {
  onAdd: (text: string, intervalHours: number) => void;
}

type IntervalUnit = 'hours' | 'days' | 'weeks';

export function AddHabitRow({ onAdd }: AddHabitRowProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [text, setText] = useState('');
  const [intervalValue, setIntervalValue] = useState(1);
  const [intervalUnit, setIntervalUnit] = useState<IntervalUnit>('days');

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

  const handleAdd = () => {
    if (text.trim()) {
      const hours = getHoursFromInterval(intervalValue, intervalUnit);
      onAdd(text.trim(), hours);
      setText('');
      setIntervalValue(1);
      setIntervalUnit('days');
      setIsAdding(false);
    }
  };

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="w-full px-5 py-2.5 text-left text-sm text-stone-400 hover:text-stone-600 hover:bg-stone-50 border-t border-stone-100 transition-colors"
      >
        + Add habit
      </button>
    );
  }

  return (
    <div className="px-5 py-3 border-t border-stone-100 bg-stone-50/50">
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd();
            if (e.key === 'Escape') {
              setText('');
              setIntervalValue(1);
              setIntervalUnit('days');
              setIsAdding(false);
            }
          }}
          placeholder="Habit name..."
          className="flex-1 px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-kyoto-red"
          autoFocus
        />
        <button
          onClick={handleAdd}
          className="px-4 py-2 text-sm bg-kyoto-red text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          Add
        </button>
      </div>
      <div className="flex gap-2 items-center">
        <span className="text-xs text-stone-500">every</span>
        <input
          type="number"
          min="1"
          value={intervalValue}
          onChange={(e) => setIntervalValue(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-16 px-2 py-1 text-xs bg-white border border-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-kyoto-red"
        />
        <select
          value={intervalUnit}
          onChange={(e) => setIntervalUnit(e.target.value as IntervalUnit)}
          className="px-2 py-1 text-xs bg-white border border-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-kyoto-red"
        >
          <option value="hours">hours</option>
          <option value="days">days</option>
          <option value="weeks">weeks</option>
        </select>
        <button
          onClick={() => {
            setText('');
            setIntervalValue(1);
            setIntervalUnit('days');
            setIsAdding(false);
          }}
          className="ml-auto text-xs text-stone-400 hover:text-stone-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
