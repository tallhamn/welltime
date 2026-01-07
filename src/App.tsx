import { useState, useEffect } from 'react';
import type { Habit, Task, LLMAction, AppState } from '@/lib/types';
import { generateId, getTodayDate } from '@/lib/utils';
import { EXAMPLE_HABITS, EXAMPLE_TASKS } from '@/lib/exampleData';
import { useCoachMessage } from '@/hooks/useCoachMessage';
import { HabitsSection } from '@/components/HabitsSection';
import { TasksSection } from '@/components/TasksSection';
import { ChatPanel } from '@/components/ChatPanel';
import { UndoBar } from '@/components/UndoBar';
import { initializeStorage, isInitialized, loadCurrentState, saveCurrentState } from '@/lib/storage';

function App() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours());
  const [chatOpen, setChatOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Undo functionality
  const [undoState, setUndoState] = useState<AppState | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const [undoMessage, setUndoMessage] = useState('');

  const { message: coachMessage, triggerReinforcement } = useCoachMessage(habits, currentHour);

  // Initialize storage and load data on mount
  useEffect(() => {
    const initApp = async () => {
      try {
        await initializeStorage();
        const initialized = await isInitialized();

        if (initialized) {
          const state = await loadCurrentState();
          if (state) {
            setHabits(state.habits);
            setTasks(state.tasks);
          }
        } else {
          // First launch: use example data
          setHabits(EXAMPLE_HABITS);
          setTasks(EXAMPLE_TASKS);
          await saveCurrentState({ habits: EXAMPLE_HABITS, tasks: EXAMPLE_TASKS });
        }
      } catch (error) {
        console.error('Failed to initialize storage:', error);
        // Fallback to example data
        setHabits(EXAMPLE_HABITS);
        setTasks(EXAMPLE_TASKS);
      } finally {
        setIsLoading(false);
      }
    };

    initApp();
  }, []);

  // Auto-save when habits or tasks change
  useEffect(() => {
    if (!isLoading && (habits.length > 0 || tasks.length > 0)) {
      saveCurrentState({ habits, tasks }).catch((error) => {
        console.error('Failed to save state:', error);
      });
    }
  }, [habits, tasks, isLoading]);

  // Update current hour every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Habit handlers
  const toggleHabit = (id: string) => {
    const habit = habits.find((h) => h.id === id);
    if (!habit) return;

    const now = new Date().toISOString();
    const wasAvailable = !habit.lastCompleted ||
      (Date.now() - new Date(habit.lastCompleted).getTime()) >= (habit.repeatIntervalHours * 60 * 60 * 1000);

    if (wasAvailable) {
      // Checking habit: mark as completed
      setHabits((prev) =>
        prev.map((h) =>
          h.id === id
            ? {
                ...h,
                lastCompleted: now,
                streak: h.streak + 1,
              }
            : h
        )
      );
      triggerReinforcement(habit.text, habit.streak);
    } else {
      // Unchecking habit: make it available again
      setHabits((prev) =>
        prev.map((h) =>
          h.id === id
            ? {
                ...h,
                lastCompleted: null,
                streak: Math.max(0, h.streak - 1),
              }
            : h
        )
      );
    }
  };

  const deleteHabit = (id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
  };

  const updateHabitInterval = (id: string, intervalHours: number) => {
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, repeatIntervalHours: intervalHours } : h)));
  };

  const updateHabitText = (id: string, text: string) => {
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, text } : h)));
  };

  const addHabitReflection = (id: string, reflection: string) => {
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, reflections: [...(h.reflections || []), reflection] } : h))
    );
  };

  const addHabit = (text: string, intervalHours: number) => {
    if (text.trim()) {
      setHabits((prev) => [
        ...prev,
        {
          id: generateId(),
          text: text.trim(),
          streak: 0,
          lastCompleted: null,
          repeatIntervalHours: intervalHours,
          reflections: [],
        },
      ]);
    }
  };

  // Task handlers
  const findAndUpdate = (tasks: Task[], id: string, updater: (task: Task) => Task): Task[] =>
    tasks.map((task) =>
      task.id === id ? updater(task) : { ...task, children: findAndUpdate(task.children || [], id, updater) }
    );

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      findAndUpdate(prev, id, (t) => ({
        ...t,
        completed: !t.completed,
        completedAt: !t.completed ? getTodayDate() : null,
      }))
    );
  };

  const addTaskReflection = (id: string, reflection: string) => {
    setTasks((prev) => findAndUpdate(prev, id, (t) => ({ ...t, reflection })));
  };

  const addTask = (text: string) => {
    if (text.trim()) {
      setTasks((prev) => [
        ...prev,
        {
          id: generateId(),
          text: text.trim(),
          completed: false,
          completedAt: null,
          reflection: null,
          children: [],
        },
      ]);
    }
  };

  const addSubtask = (parentId: string, text: string) => {
    setTasks((prev) =>
      findAndUpdate(prev, parentId, (t) => ({
        ...t,
        children: [
          ...(t.children || []),
          {
            id: generateId(),
            text,
            completed: false,
            completedAt: null,
            reflection: null,
            children: [],
          },
        ],
      }))
    );
  };

  // Handle LLM actions
  const handleLLMAction = (action: LLMAction) => {
    // Save current state for undo
    setUndoState({ habits, tasks });

    switch (action.type) {
      case 'add_subtask':
        if (action.parentId && action.text) {
          addSubtask(action.parentId, action.text);
          setUndoMessage(`Added subtask: "${action.text.slice(0, 40)}..."`);
          setShowUndo(true);
          setTimeout(() => setShowUndo(false), 10000);
        }
        break;

      case 'add_task':
        if (action.text) {
          addTask(action.text);
          setUndoMessage(`Added task: "${action.text}"`);
          setShowUndo(true);
          setTimeout(() => setShowUndo(false), 10000);
        }
        break;

      default:
        console.log('Unhandled action:', action);
    }
  };

  // Undo handler
  const handleUndo = () => {
    if (undoState) {
      setHabits(undoState.habits);
      setTasks(undoState.tasks);
      setUndoState(null);
      setShowUndo(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stone-600">Loading Welltime...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className={`transition-all duration-300 ${chatOpen ? 'mr-0 sm:mr-96' : ''}`}>
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-5">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-lg font-semibold text-stone-800">WELLTIME</h1>
              <div className="flex-1 max-w-md mx-4">
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search habits & tasks..."
                    className="w-full pl-9 pr-3 py-1.5 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-kyoto-red focus:bg-white transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-stone-100 pt-3 mt-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-2xl font-semibold text-stone-800">
                    {habits.filter(h =>
                      h.lastCompleted &&
                      (Date.now() - new Date(h.lastCompleted).getTime()) < (h.repeatIntervalHours * 60 * 60 * 1000)
                    ).length}
                  </span>
                  <span className="text-sm text-stone-400"> of {habits.length}</span>
                </div>
              </div>
              <p className="text-sm text-stone-600 flex-1 mx-4">{coachMessage}</p>
              <button
                onClick={() => setChatOpen(true)}
                className="px-3 py-1.5 bg-kyoto-light text-kyoto-red text-xs font-semibold rounded-lg hover:bg-kyoto-medium transition-colors"
              >
                Plan
              </button>
            </div>
          </div>

        {/* Habits Section */}
        <HabitsSection
          habits={habits}
          currentHour={currentHour}
          searchQuery={searchQuery}
          onToggle={toggleHabit}
          onDelete={deleteHabit}
          onUpdateInterval={updateHabitInterval}
          onUpdateText={updateHabitText}
          onAddReflection={addHabitReflection}
          onAddHabit={addHabit}
        />

        {/* Spacer */}
        <div className="h-5" />

        {/* Tasks Section */}
        <TasksSection
          tasks={tasks}
          searchQuery={searchQuery}
          onToggle={toggleTask}
          onAddReflection={addTaskReflection}
          onAddSubtask={addSubtask}
          onAddTask={addTask}
        />
        </div>
      </div>

      {/* Chat Panel */}
      <ChatPanel
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        habits={habits}
        tasks={tasks}
        currentHour={currentHour}
        onAction={handleLLMAction}
      />

      {/* Undo Bar */}
      <UndoBar
        show={showUndo}
        message={undoMessage}
        onUndo={handleUndo}
        onDismiss={() => setShowUndo(false)}
      />
    </div>
  );
}

export default App;
