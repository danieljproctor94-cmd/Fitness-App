import { useEffect, useRef } from 'react';
import { useData } from '@/features/data/DataContext';
import { useNotifications } from '@/features/notifications/NotificationContext';

export function ReminderManager() {
    const { todos } = useData();
    const { addNotification } = useNotifications();
    const processedRef = useRef(new Set<string>());

    useEffect(() => {
        const checkReminders = () => {
            if (!todos || todos.length === 0) return;
            const now = new Date();
            const nowMs = now.getTime();

            // Load cross-tab sent reminders from localStorage
            let crossTabSent: Record<string, number> = {};
            try {
                const stored = localStorage.getItem('fapp_sent_reminders');
                crossTabSent = stored ? JSON.parse(stored) : {};
                
                // Cleanup old entries (older than 24h) to keep it small
                const yesterday = Date.now() - 86400000;
                let hasChanges = false;
                Object.keys(crossTabSent).forEach(k => {
                    if (crossTabSent[k] < yesterday) {
                        delete crossTabSent[k];
                        hasChanges = true;
                    }
                });
                if (hasChanges) {
                    localStorage.setItem('fapp_sent_reminders', JSON.stringify(crossTabSent));
                }
            } catch (e) {
                crossTabSent = {};
            }

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
                let offset = 600000; // 10 min (default)

                if (todo.notify_before === '1_hour') {
                    offset = 3600000;
                } else if (todo.notify_before === '1_day') {
                    offset = 86400000;
                } else if (todo.notify_before === 'at_time') {
                    offset = 0;
                } else if (todo.notify_before === '5_min') {
                    offset = 300000;
                } else if (todo.notify_before === '15_min') {
                    offset = 900000;
                } else if (todo.notify_before === '30_min') {
                    offset = 1800000;
                }
                
                triggerTimeMs -= offset;

                const diff = nowMs - triggerTimeMs;
                // 2 minutes window
                if (diff >= 0 && diff < 120000) {
                    const key = `${todo.id}-${triggerTimeMs}`;
                    
                    // Check both local ref and cross-tab localStorage
                    if (!processedRef.current.has(key) && !crossTabSent[key]) {
                        console.log('Triggering reminder for:', todo.title);
                        const p = h >= 12 ? 'PM' : 'AM';
                        const hr = h % 12 || 12;
                        const min = m.toString().padStart(2, '0');
                        const timeStr = `${hr}:${min} ${p}`;

                        // Mark as sent immediately to race against other tabs
                        crossTabSent[key] = Date.now();
                        localStorage.setItem('fapp_sent_reminders', JSON.stringify(crossTabSent));
                        processedRef.current.add(key);

                        addNotification({
                            title: 'Reminder: ' + todo.title,
                            message: 'Due at ' + timeStr,
                            type: 'info'
                        });
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