import { useState, useEffect } from 'react';
import type { Habit } from '@/lib/types';
import { isHabitAvailable } from '@/lib/utils';

interface LastAction {
  text: string;
  streak: number;
}

export function useCoachMessage(habits: Habit[], currentHour: number) {
  const [message, setMessage] = useState('');
  const [lastAction, setLastAction] = useState<LastAction | null>(null);

  useEffect(() => {
    const availableHabits = habits.filter((h) => isHabitAvailable(h.lastCompleted, h.repeatIntervalHours));
    const completedCount = habits.filter((h) =>
      h.lastCompleted &&
      (Date.now() - new Date(h.lastCompleted).getTime()) < (h.repeatIntervalHours * 60 * 60 * 1000)
    ).length;
    const total = habits.length;

    let newMessage = '';

    if (lastAction) {
      // Reinforcing mode - first person self-talk
      const messages = [
        `${lastAction.text} done. ${lastAction.streak + 1} days. I keep stacking.`,
        `${completedCount}/${total}. I carry the boats.`,
        `One more down. This is who I am.`,
      ];
      newMessage = messages[Math.floor(Math.random() * messages.length)];
    } else if (completedCount === total && total > 0) {
      // All done - self-talk
      const messages = [`All ${total} crushed. I carry the boats.`, `Full sweep. This is who I am.`];
      newMessage = messages[Math.floor(Math.random() * messages.length)];
    } else if (availableHabits.length > 0) {
      // Coaching mode - second person
      const messages = [
        `${availableHabits[0].text} is up. You know what to do.`,
        `${availableHabits.length} ready. ${availableHabits[0].text} is waiting.`,
      ];
      newMessage = messages[Math.floor(Math.random() * messages.length)];
    } else if (completedCount > 0) {
      newMessage = `${completedCount} down, ${total - completedCount} to go. Keep moving.`;
    } else if (total > 0) {
      newMessage = `New day. ${total} opportunities to prove who you are.`;
    } else {
      newMessage = 'Build your system. Start with one habit.';
    }

    setMessage(newMessage);
  }, [habits, currentHour, lastAction]);

  const triggerReinforcement = (habitText: string, habitStreak: number) => {
    setLastAction({ text: habitText, streak: habitStreak });
    setTimeout(() => setLastAction(null), 4000);
  };

  return { message, triggerReinforcement };
}
