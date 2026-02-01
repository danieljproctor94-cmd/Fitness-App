import { useEffect } from 'react';
import { useData } from '@/features/data/DataContext';
import { useNotifications } from '@/features/notifications/NotificationContext';
import { parseISO, isSameDay, subMinutes, subHours, subDays, isAfter, set } from 'date-fns';

export function useTaskScheduler() {
    const { todos } = useData();
    const { addNotification } = useNotifications();

    useEffect(() => {
        const checkTasks = () => {
            const now = new Date();

            todos.forEach(todo => {
                // Skip if not notifying or already completed
                if (!todo.notify || todo.completed) return;

                // Determine effective due date/time
                let dueDateTime: Date | null = null;

                if (todo.due_date) {
                    const parsedDate = parseISO(todo.due_date);

                    if (todo.due_time) {
                        const [hours, minutes] = todo.due_time.split(':').map(Number);
                        dueDateTime = set(parsedDate, { hours, minutes });
                    } else {
                        // If no time, maybe notify at start of day? Or 9 AM default?
                        // Let's assume 9 AM for date-only notifications if they requested notification
                        dueDateTime = set(parsedDate, { hours: 9, minutes: 0 });
                    }
                } else {
                    // No date? Can't really notify unless it's daily recurrence without date (unlikely usage)
                    return;
                }

                // Handle Recurrence (Simple "Is it due today?" check)
                // If recurring 'daily', it's due today.
                // If 'weekly', check day of week.
                // If 'monthly', check day of month.
                let isDueToday = false;

                if (todo.recurrence === 'none') {
                    isDueToday = isSameDay(dueDateTime, now);
                } else if (todo.recurrence === 'daily') {
                    isDueToday = true;
                    // Adjust dueDateTime to today for logic comparison
                    dueDateTime = set(now, {
                        hours: dueDateTime.getHours(),
                        minutes: dueDateTime.getMinutes()
                    });
                } else if (todo.recurrence === 'weekly') {
                    isDueToday = dueDateTime.getDay() === now.getDay();
                    if (isDueToday) {
                        dueDateTime = set(now, {
                            hours: dueDateTime.getHours(),
                            minutes: dueDateTime.getMinutes()
                        });
                    }
                } else if (todo.recurrence === 'monthly') {
                    isDueToday = dueDateTime.getDate() === now.getDate();
                    if (isDueToday) {
                        dueDateTime = set(now, {
                            hours: dueDateTime.getHours(),
                            minutes: dueDateTime.getMinutes()
                        });
                    }
                }

                if (!isDueToday || !dueDateTime) return;

                // Calculate Notification Trigger Time
                let triggerTime = dueDateTime;
                if (todo.notify_before === '10_min') triggerTime = subMinutes(dueDateTime, 10);
                else if (todo.notify_before === '1_hour') triggerTime = subHours(dueDateTime, 1);
                else if (todo.notify_before === '1_day') triggerTime = subDays(dueDateTime, 1);

                // Check if we should trigger
                // Trigger if NOW is after triggerTime AND NOW is before dueDateTime + buffer (e.g. 1 hour late)
                // This prevents notifying for old tasks immediately upon load, or maybe we DO want to notify pending tasks?
                // Let's imply a window: Trigger if we are past the trigger time.

                if (isAfter(now, triggerTime)) {
                    // Unique Key for Storage: ID + Date + "notified"
                    const dateKey = now.toISOString().split('T')[0];
                    const storageKey = `fitness_app_notified_${todo.id}_${dateKey}`;

                    const alreadyNotified = localStorage.getItem(storageKey);

                    if (!alreadyNotified) {
                        // Trigger it!
                        addNotification({
                            title: `Task Reminder: ${todo.title}`,
                            message: `Task is due ${todo.notify_before ? 'soon' : 'now'}!`,
                            type: 'info'
                        });

                        // Mark handled
                        localStorage.setItem(storageKey, 'true');
                    }
                }
            });
        };

        // Check immediately on mount, then interval
        checkTasks();

        const interval = setInterval(checkTasks, 60 * 1000); // Check every minute
        return () => clearInterval(interval);

    }, [todos, addNotification]);
}
