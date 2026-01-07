import type { Habit, Task } from './types';
import { generateId } from './utils';

/**
 * Example habits shown on first launch
 */
export const EXAMPLE_HABITS: Habit[] = [
  {
    id: generateId(),
    text: 'Morning workout',
    streak: 12,
    completedToday: false,
    timeWindow: 'morning',
    reflections: [
      'Felt sluggish but pushed through - always feel better after',
      'Tried new HIIT routine, way more efficient',
    ],
  },
  {
    id: generateId(),
    text: 'Review daily goals',
    streak: 5,
    completedToday: true,
    timeWindow: 'morning',
    reflections: ['Keeping it to 3 priorities max works best'],
  },
  {
    id: generateId(),
    text: 'Focused coding block',
    streak: 8,
    completedToday: false,
    timeWindow: 'midday',
    reflections: ['Phone in other room = 2x productivity', 'Music helps, podcasts distract'],
  },
  {
    id: generateId(),
    text: 'Walk the property',
    streak: 3,
    completedToday: false,
    timeWindow: 'afternoon',
    reflections: [],
  },
  {
    id: generateId(),
    text: 'Evening wind-down',
    streak: 22,
    completedToday: false,
    timeWindow: 'evening',
    reflections: ['No screens after 9pm is game changer for sleep'],
  },
];

/**
 * Example tasks shown on first launch
 */
export const EXAMPLE_TASKS: Task[] = [
  {
    id: generateId(),
    text: 'Hire VP of Sales',
    completed: false,
    completedAt: null,
    reflection: null,
    children: [
      {
        id: generateId(),
        text: 'Define role requirements and comp range',
        completed: true,
        completedAt: '2025-01-05',
        reflection:
          'Took longer than expected - should have talked to other founders first to benchmark comp',
        children: [],
      },
      {
        id: generateId(),
        text: 'Reach out to network for referrals',
        completed: false,
        completedAt: null,
        reflection: null,
        children: [],
      },
      {
        id: generateId(),
        text: 'Contact 3 executive recruiters',
        completed: false,
        completedAt: null,
        reflection: null,
        children: [],
      },
    ],
  },
  {
    id: generateId(),
    text: 'Guest house network infrastructure',
    completed: false,
    completedAt: null,
    reflection: null,
    children: [
      {
        id: generateId(),
        text: 'Order Cat6A burial cable',
        completed: true,
        completedAt: '2025-01-03',
        reflection: 'Monoprice was way cheaper than Amazon, saved $80',
        children: [],
      },
      {
        id: generateId(),
        text: 'Rent trencher for cable run',
        completed: false,
        completedAt: null,
        reflection: null,
        children: [],
      },
      {
        id: generateId(),
        text: 'Install network rack in utility closet',
        completed: false,
        completedAt: null,
        reflection: null,
        children: [],
      },
    ],
  },
  {
    id: generateId(),
    text: 'Research sparkling wine selections',
    completed: false,
    completedAt: null,
    reflection: null,
    children: [],
  },
  {
    id: generateId(),
    text: 'Fix garage door opener',
    completed: true,
    completedAt: '2025-01-02',
    reflection:
      'YouTube tutorial made this easy - 20 min fix, didnt need to call repair guy',
    children: [],
  },
  {
    id: generateId(),
    text: 'Schedule annual HVAC maintenance',
    completed: true,
    completedAt: '2024-12-28',
    reflection: null,
    children: [],
  },
  {
    id: generateId(),
    text: 'Review Q4 investment portfolio',
    completed: true,
    completedAt: '2024-12-20',
    reflection:
      'Spent too long on this - next time just rebalance to target allocations, dont overthink',
    children: [],
  },
];
