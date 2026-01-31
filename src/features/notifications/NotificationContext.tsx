import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/AuthContext';

export type Notification = {
    id: string;
    title: string;
    message: string;
    read: boolean;
    timestamp: Date;
    type: 'info' | 'success' | 'warning' | 'error';
};

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    pushEnabled: boolean;
    enablePush: () => Promise<void>;
    markAsRead: (id: string) => void;
    clearAll: () => void;
    addNotification: (notification: Omit<Notification, 'id' | 'read' | 'timestamp'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const { user } = useAuth(); // Assuming AuthContext provides 'user'

    const [pushEnabled, setPushEnabled] = useState(false);

    useEffect(() => {
        if ('Notification' in window) {
            setPushEnabled(Notification.permission === 'granted');
        }
    }, []);

    // Fetch and Subscribe to Notifications
    useEffect(() => {
        if (!user) {
            setNotifications([]);
            return;
        }

        // 1. Fetch initial unread notifications
        const fetchNotifications = async () => {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.error('Error fetching notifications:', error);
            } else if (data) {
                // Map DB keys to local type if needed, or ensure they match
                const mapped: Notification[] = data.map(n => ({
                    id: n.id,
                    title: n.title,
                    message: n.message,
                    read: n.read,
                    timestamp: new Date(n.created_at),
                    type: n.type as any
                }));
                setNotifications(mapped);
            }
        };

        fetchNotifications();

        // 2. Realtime Subscription
        const channel = supabase
            .channel('public:notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    const newNotif = payload.new;
                    const formatted: Notification = {
                        id: newNotif.id,
                        title: newNotif.title,
                        message: newNotif.message,
                        read: newNotif.read,
                        timestamp: new Date(newNotif.created_at),
                        type: newNotif.type as any
                    };

                    setNotifications(prev => [formatted, ...prev]);

                    // Trigger System Notification if PWA Push is enabled/supported
                    if (Notification.permission === 'granted' && 'serviceWorker' in navigator) {
                        navigator.serviceWorker.ready.then(registration => {
                            registration.showNotification(formatted.title, {
                                body: formatted.message,
                                icon: '/pwa-192x192.png'
                            });
                        });
                    } else if (Notification.permission === 'granted') {
                        new Notification(formatted.title, { body: formatted.message });
                    } else {
                        toast(formatted.title, { description: formatted.message });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const enablePush = async () => {
        if (!('Notification' in window)) {
            toast.error('Notifications are not supported by your browser.');
            return;
        }

        try {
            const permission = await Notification.requestPermission();
            setPushEnabled(permission === 'granted');

            if (permission === 'granted') {
                toast.success('Push notifications enabled!');
                // Ensure SW is ready
                if ('serviceWorker' in navigator) {
                    await navigator.serviceWorker.ready;
                }
            } else if (permission === 'denied') {
                toast.error('Notifications denied. Please enable them in your browser settings.');
            }
        } catch (error) {
            console.error('Error enabling push:', error);
            toast.error('Failed to enable notifications');
        }
    };

    const markAsRead = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.map(n =>
            n.id === id ? { ...n, read: true } : n
        ));

        if (user) {
            await supabase.from('notifications').update({ read: true }).eq('id', id);
        }
    };

    const clearAll = async () => {
        // Optimistic
        setNotifications([]);
        if (user) {
            // Mark all as read in DB? Or delete? Usually "Clear" in UI implies "Mark all read" or "Hide"
            // For now, let's mark all as read
            await supabase.from('notifications').update({ read: true }).eq('user_id', user.id);
        }
    };

    const addNotification = async (notification: Omit<Notification, 'id' | 'read' | 'timestamp'>) => {
        // This method is mainly used by client-side logic.
        // If we want persistence, we should writes to DB.

        if (!user) return;

        const { error } = await supabase.from('notifications').insert([{
            user_id: user.id,
            title: notification.title,
            message: notification.message,
            type: notification.type
        }]);

        if (error) {
            console.error("Error adding notification:", error);
        }
        // Realtime subscription will catch the insertion and update state
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            pushEnabled,
            enablePush,
            markAsRead,
            clearAll,
            addNotification
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
