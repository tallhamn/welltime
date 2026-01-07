import { useState } from 'react';
import type { Task } from '@/lib/types';
import { TASK_DEPTH_COLORS } from '@/lib/constants';

interface TaskItemProps {
  task: Task;
  depth: number;
  showCompleted: boolean;
  onToggle: (id: string) => void;
  onAddReflection: (id: string, reflection: string) => void;
  onAddSubtask: (parentId: string, text: string) => void;
}

export function TaskItem({
  task,
  depth,
  showCompleted,
  onToggle,
  onAddReflection,
  onAddSubtask,
}: TaskItemProps) {
  const [showReflectionInput, setShowReflectionInput] = useState(false);
  const [reflectionText, setReflectionText] = useState('');
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [subtaskText, setSubtaskText] = useState('');

  const visibleChildren = showCompleted
    ? task.children
    : task.children?.filter((child) => !child.completed) || [];

  if (!showCompleted && task.completed && visibleChildren.length === 0) {
    return null;
  }

  const depthColor = TASK_DEPTH_COLORS[depth % TASK_DEPTH_COLORS.length];

  const handleToggle = () => {
    if (!task.completed) {
      onToggle(task.id);
      setShowReflectionInput(true);
    } else {
      onToggle(task.id);
    }
  };

  const handleSaveReflection = () => {
    if (reflectionText.trim()) {
      onAddReflection(task.id, reflectionText.trim());
    }
    setShowReflectionInput(false);
    setReflectionText('');
  };

  const handleSkipReflection = () => {
    setShowReflectionInput(false);
    setReflectionText('');
  };

  const handleAddSubtask = () => {
    if (subtaskText.trim()) {
      onAddSubtask(task.id, subtaskText.trim());
      setSubtaskText('');
      setShowAddSubtask(false);
    }
  };

  return (
    <div className={`${depth > 0 ? `ml-5 pl-3 border-l-2 ${depthColor}` : ''}`}>
      <div className={`group py-2 ${task.completed && !showReflectionInput ? 'opacity-40' : ''}`}>
        <div className="flex items-start gap-2.5">
          <button
            onClick={handleToggle}
            className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0
              ${
                task.completed
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : 'border-stone-300 hover:border-emerald-400'
              }`}
          >
            {task.completed && (
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
          <div className="flex-1">
            <span className={`text-sm text-stone-700 ${task.completed ? 'line-through text-stone-400' : ''}`}>
              {task.text}
            </span>
            {task.reflection && !showReflectionInput && (
              <p className="text-xs text-amber-600 mt-1 flex items-start gap-1">
                <svg
                  className="w-3 h-3 mt-0.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                {task.reflection}
              </p>
            )}
          </div>
          {!task.completed && (
            <button
              onClick={() => setShowAddSubtask(true)}
              className="p-1 text-stone-300 hover:text-stone-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              title="Add subtask"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>

        {/* Add subtask input */}
        {showAddSubtask && (
          <div className="mt-2 ml-6 flex gap-2">
            <input
              type="text"
              value={subtaskText}
              onChange={(e) => setSubtaskText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddSubtask();
                if (e.key === 'Escape') {
                  setSubtaskText('');
                  setShowAddSubtask(false);
                }
              }}
              placeholder="Subtask..."
              className="flex-1 px-3 py-1.5 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300"
              autoFocus
            />
            <button onClick={handleAddSubtask} className="px-3 py-1.5 text-xs bg-stone-800 text-white rounded-lg">
              Add
            </button>
            <button
              onClick={() => {
                setSubtaskText('');
                setShowAddSubtask(false);
              }}
              className="px-2 py-1.5 text-xs text-stone-400 hover:text-stone-600"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Reflection input after completing */}
        {showReflectionInput && (
          <div className="mt-2 ml-6 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-xs text-amber-700 mb-2 font-medium">How did it go? (optional)</p>
            <textarea
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              placeholder="What worked? What would you do differently?"
              className="w-full px-3 py-2 text-sm bg-white border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
              rows={2}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={handleSkipReflection} className="px-3 py-1 text-xs text-stone-500 hover:text-stone-700">
                Skip
              </button>
              <button
                onClick={handleSaveReflection}
                className="px-3 py-1 text-xs bg-amber-500 text-white rounded hover:bg-amber-600"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recursive render of children */}
      {visibleChildren.map((child) => (
        <TaskItem
          key={child.id}
          task={child}
          depth={depth + 1}
          showCompleted={showCompleted}
          onToggle={onToggle}
          onAddReflection={onAddReflection}
          onAddSubtask={onAddSubtask}
        />
      ))}
    </div>
  );
}
