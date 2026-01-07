import type { Habit, Task, AppState } from './types';
import { generateId } from './utils';

/**
 * Serialize habits and tasks to Markdown format
 */
export function serializeToMarkdown(habits: Habit[], tasks: Task[]): string {
  let md = '# Habits\n\n';

  habits.forEach((habit) => {
    md += `## ${habit.text}\n`;
    md += `- Window: ${habit.timeWindow}\n`;
    md += `- Streak: ${habit.streak}\n`;
    md += `- Completed today: ${habit.completedToday ? 'yes' : 'no'}\n`;
    if (habit.reflections && habit.reflections.length > 0) {
      md += `- Reflections:\n`;
      habit.reflections.forEach((r) => {
        md += `  - ${r}\n`;
      });
    }
    md += '\n';
  });

  md += '---\n\n# Tasks\n\n';

  const serializeTask = (task: Task, depth = 0) => {
    const indent = '  '.repeat(depth);
    const checkbox = task.completed ? '[x]' : '[ ]';
    const completedDate = task.completedAt ? ` (${task.completedAt})` : '';
    md += `${indent}- ${checkbox} ${task.text}${completedDate}\n`;
    if (task.reflection) {
      md += `${indent}  > ${task.reflection}\n`;
    }
    if (task.children) {
      task.children.forEach((child) => serializeTask(child, depth + 1));
    }
  };

  tasks.forEach((task) => {
    md += `## ${task.text}\n`;
    if (task.completed) {
      md += `- Status: completed${task.completedAt ? ` (${task.completedAt})` : ''}\n`;
    }
    if (task.reflection) {
      md += `> ${task.reflection}\n`;
    }
    if (task.children && task.children.length > 0) {
      task.children.forEach((child) => serializeTask(child, 0));
    }
    md += '\n';
  });

  return md;
}

/**
 * Parse Markdown into habits and tasks
 */
export function parseMarkdown(md: string): AppState {
  const habits: Habit[] = [];
  const tasks: Task[] = [];

  const lines = md.split('\n');
  let currentSection: 'habits' | 'tasks' | null = null;
  let currentHabit: Habit | null = null;
  let currentTask: Task | null = null;
  let taskStack: Task[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line === '# Habits') {
      currentSection = 'habits';
      continue;
    }
    if (line === '# Tasks') {
      currentSection = 'tasks';
      continue;
    }
    if (line === '---') continue;

    if (currentSection === 'habits') {
      if (line.startsWith('## ')) {
        if (currentHabit) habits.push(currentHabit);
        currentHabit = {
          id: generateId(),
          text: line.slice(3),
          timeWindow: 'morning',
          streak: 0,
          completedToday: false,
          reflections: [],
        };
      } else if (currentHabit) {
        if (line.startsWith('- Window: ')) {
          currentHabit.timeWindow = line.slice(10) as any;
        } else if (line.startsWith('- Streak: ')) {
          currentHabit.streak = parseInt(line.slice(10)) || 0;
        } else if (line.startsWith('- Completed today: ')) {
          currentHabit.completedToday = line.slice(19) === 'yes';
        } else if (line.startsWith('  - ')) {
          currentHabit.reflections.push(line.slice(4));
        }
      }
    }

    if (currentSection === 'tasks') {
      if (line.startsWith('## ')) {
        if (currentTask) tasks.push(currentTask);
        currentTask = {
          id: generateId(),
          text: line.slice(3),
          completed: false,
          completedAt: null,
          reflection: null,
          children: [],
        };
        taskStack = [currentTask];
      } else if (currentTask) {
        if (line.startsWith('- Status: completed')) {
          currentTask.completed = true;
          const dateMatch = line.match(/\((\d{4}-\d{2}-\d{2})\)/);
          if (dateMatch) currentTask.completedAt = dateMatch[1];
        } else if (line.startsWith('> ') && taskStack.length === 1) {
          currentTask.reflection = line.slice(2);
        } else if (line.match(/^(\s*)- \[(x| )\] /)) {
          const match = line.match(/^(\s*)- \[(x| )\] (.+?)(?:\s+\((\d{4}-\d{2}-\d{2})\))?$/);
          if (match) {
            const depth = match[1].length / 2;
            const completed = match[2] === 'x';
            const text = match[3];
            const completedAt = match[4] || null;

            const newTask: Task = {
              id: generateId(),
              text,
              completed,
              completedAt,
              reflection: null,
              children: [],
            };

            // Adjust stack to correct depth
            while (taskStack.length > depth + 1) {
              taskStack.pop();
            }

            const parent = taskStack[taskStack.length - 1];
            parent.children.push(newTask);
            taskStack.push(newTask);
          }
        } else if (line.match(/^\s*> /)) {
          // Reflection for a subtask
          const reflection = line.trim().slice(2);
          if (taskStack.length > 1) {
            taskStack[taskStack.length - 1].reflection = reflection;
          }
        }
      }
    }
  }

  // Push final items
  if (currentSection === 'habits' && currentHabit) {
    habits.push(currentHabit);
  }
  if (currentSection === 'tasks' && currentTask) {
    tasks.push(currentTask);
  }

  return { habits, tasks };
}
