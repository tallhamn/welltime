import type { Task } from '@/lib/types';
import { TaskItem } from './TaskItem';
import { AddTaskRow } from './AddTaskRow';

interface TasksSectionProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onAddReflection: (id: string, reflection: string) => void;
  onAddSubtask: (parentId: string, text: string) => void;
  onAddTask: (text: string) => void;
}

export function TasksSection({ tasks, onToggle, onAddReflection, onAddSubtask, onAddTask }: TasksSectionProps) {
  // Default view: show tasks that are incomplete or have incomplete children
  const visibleTasks = tasks.filter(
    (t) => !t.completed || (t.children && t.children.some((c) => !c.completed))
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200/80 overflow-hidden">
      <div className="px-5 py-3 border-b border-stone-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center">
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <span className="font-medium text-stone-800 text-sm">Tasks</span>
          </div>
        </div>

        <p className="text-xs text-stone-400">Showing open tasks</p>
      </div>

      <div className="px-5 py-2">
        {visibleTasks.length > 0 ? (
          visibleTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              depth={0}
              showCompleted={false}
              onToggle={onToggle}
              onAddReflection={onAddReflection}
              onAddSubtask={onAddSubtask}
            />
          ))
        ) : (
          <div className="py-8 text-center text-stone-400 text-sm">All tasks complete! 🎉</div>
        )}
      </div>

      <AddTaskRow onAdd={onAddTask} />
    </div>
  );
}
