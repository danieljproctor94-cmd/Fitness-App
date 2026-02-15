import { useEffect, useRef } from 'react';
import { useData } from '@/features/data/DataContext';
import { useNotifications } from '@/features/notifications/NotificationContext';

export function ReminderManager() {
    const { todos } = useData();
    const { addNotification } = useNotifications();
    const processedRef = useRef(new Set());

    useEffect(() => {
        const checkReminders = () => {
            if (!todos || todos.length === 0) return;
            const now = new Date();
            const nowMs = now.getTime();

            todos.forEach(todo => {
                if (!todo.notify || todo.completed) return;
                if (!todo.due_date || !todo.due_time) return;

                const dp = todo.due_date.split('-').map(Number);
                const tp = todo.due_time.split(':').map(Number);
                const year = dp[0];
                const month = dp[1];
                const day = dp[2];
                const h = tp[0];
                const m = tp[1];

                const dueDateTime = new Date(year, month - 1, day, h, m, 0, 0);
                const dueTimeMs = dueDateTime.getTime();

                let triggerTimeMs = dueTimeMs;
                let offset = 600000; // 10 min

                if (todo.notify_before === '1_hour') {
                    offset = 3600000;
                } else if (todo.notify_before === '1_day') {
                    offset = 86400000;
                }
                triggerTimeMs -= offset;

                const diff = nowMs - triggerTimeMs;
                // 2 minutes window
                if (diff >= 0 && diff < 120000) {
                    const key = todo.id + '-' + triggerTimeMs;
                    if (!processedRef.current.has(key)) {
                        console.log('Triggering reminder for:', todo.title);
                        const p = h >= 12 ? 'PM' : 'AM';
                        const hr = h % 12 || 12;
                        const min = m.toString().padStart(2, '0');
                        const timeStr = hr + ':' + min + ' ' + p;

                        addNotification({
                            title: 'Reminder: ' + todo.title,
                            message: 'Task is due at ' + timeStr,
                            type: 'info'
                        });
                        processedRef.current.add(key);
                    }
                }
            });
        };

        const interval = setInterval(checkReminders, 10000);
        const timeout = setTimeout(checkReminders, 2000);
        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [todos, addNotification]);

    return null;
}
