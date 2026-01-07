import Anthropic from '@anthropic-ai/sdk';
import type { Habit, Task } from './types';

const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

if (!apiKey) {
  console.warn('VITE_ANTHROPIC_API_KEY not set. Claude API features will not work.');
}

const anthropic = apiKey ? new Anthropic({ apiKey, dangerouslyAllowBrowser: true }) : null;

/**
 * Generate system prompt with user's current context
 */
function generateSystemPrompt(habits: Habit[], tasks: Task[], currentHour: number): string {
  // Flatten tasks for context
  const flattenTasks = (tasks: Task[], depth = 0): string[] => {
    let result: string[] = [];
    for (const task of tasks) {
      const indent = '  '.repeat(depth);
      const status = task.completed ? '✓' : '○';
      result.push(`${indent}${status} ${task.text}`);
      if (task.reflection) {
        result.push(`${indent}  → Reflection: "${task.reflection}"`);
      }
      if (task.children && task.children.length > 0) {
        result = result.concat(flattenTasks(task.children, depth + 1));
      }
    }
    return result;
  };

  const habitsSummary = habits
    .map((h) => {
      const status = h.completedToday ? '✓' : '○';
      const streak = h.streak > 0 ? `🔥${h.streak}` : '';
      const reflections = h.reflections.length > 0 ? `\n    Reflections: ${h.reflections.slice(-2).map(r => `"${r}"`).join(', ')}` : '';
      return `  ${status} ${h.text} (${h.timeWindow}) ${streak}${reflections}`;
    })
    .join('\n');

  const tasksSummary = flattenTasks(tasks).join('\n');

  const completedHabits = habits.filter((h) => h.completedToday).length;
  const totalHabits = habits.length;

  return `You are a productivity assistant helping the user plan their day and break down tasks. The user follows a system-based approach (habits + tasks).

**Current Context:**
- Time: ${currentHour}:00 (current hour of the day)
- Habits completed today: ${completedHabits}/${totalHabits}

**User's Habits:**
${habitsSummary}

**User's Tasks:**
${tasksSummary}

**Your Role:**
- Help break down complex tasks into concrete, actionable subtasks
- Suggest what to prioritize based on their habits and tasks
- Reference their past reflections when relevant (they contain learned patterns)
- Be concise and actionable - suggest specific next steps
- Use a direct, motivational tone (not overly cheerful)
- When suggesting task breakdowns, provide 3-5 concrete subtasks

**Important:**
- Don't add tasks or make changes without being asked
- Focus on what they should DO, not generic advice
- Reference their own reflections/learnings when relevant
- Keep responses brief (2-3 paragraphs max)`;
}

/**
 * Send a message to Claude and get a response
 */
export async function sendMessage(
  userMessage: string,
  habits: Habit[],
  tasks: Task[],
  currentHour: number,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  if (!anthropic) {
    throw new Error('Claude API key not configured. Please add VITE_ANTHROPIC_API_KEY to your .env file.');
  }

  const systemPrompt = generateSystemPrompt(habits, tasks, currentHour);

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        ...conversationHistory.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    const textContent = response.content.find((block) => block.type === 'text');
    if (textContent && textContent.type === 'text') {
      return textContent.text;
    }

    return 'Sorry, I could not generate a response.';
  } catch (error) {
    console.error('Claude API error:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to get response from Claude: ${error.message}`);
    }
    throw new Error('Failed to get response from Claude');
  }
}

/**
 * Stream a message to Claude and get a streaming response
 */
export async function* streamMessage(
  userMessage: string,
  habits: Habit[],
  tasks: Task[],
  currentHour: number,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): AsyncGenerator<string, void, unknown> {
  if (!anthropic) {
    throw new Error('Claude API key not configured. Please add VITE_ANTHROPIC_API_KEY to your .env file.');
  }

  const systemPrompt = generateSystemPrompt(habits, tasks, currentHour);

  try {
    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        ...conversationHistory.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta'
      ) {
        yield chunk.delta.text;
      }
    }
  } catch (error) {
    console.error('Claude API streaming error:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to get response from Claude: ${error.message}`);
    }
    throw new Error('Failed to get response from Claude');
  }
}
