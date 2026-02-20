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


const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "BEWo0rG-3KnTBSYZO0X7IE-kHBQ44ntukW_3BxE5T1q-rZQ7bbGNHBGuOQV-laCXQtT0yw6KM5CTd3CPjdKOcZA";

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
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

                    setNotifications(prev => {
                        if (prev.some(n => n.id === newNotif.id)) return prev;
                        return [formatted, ...prev];
                    });

                    // Trigger System Notification
                    const triggerNotification = async () => {
                        // Show in-app toast
                        toast(formatted.title, { description: formatted.message });

                        if (Notification.permission !== 'granted') return;

                        // Use Web Locks API to prevent multiple tabs from showing the same notification
                        const lockId = 'notif_lock_' + formatted.id;
                        if (navigator.locks) {
                            navigator.locks.request(lockId, { mode: 'exclusive', ifAvailable: true }, async (lock) => {
                                if (!lock) return; // Another tab got the lock and is displaying this notification
                                await showLocalNotification();
                            });
                        } else {
                            // Fallback if locks API isn't supported
                            await showLocalNotification();
                        }
                    };

                    const showLocalNotification = async () => {
                        try {
                            if ('serviceWorker' in navigator) {
                                const registration = await navigator.serviceWorker.ready;
                                if (registration && registration.showNotification) {
                                    await registration.showNotification(formatted.title, {
                                        body: formatted.message,
                                        icon: '/logo_192.png',
                                        tag: formatted.id
                                    });
                                    return;
                                }
                            }

                            // Fallback to standard window Notification API if SW not available
                            new Notification(formatted.title, {
                                body: formatted.message,
                                icon: '/logo_192.png',
                                tag: formatted.id
                            });
                        } catch (e) {
                            console.error("Window notification failed", e);
                        }
                    };

                    triggerNotification();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const unreadCount = notifications.filter(n => !n.read).length;

    // App Icon Badging
    useEffect(() => {
        if ('setAppBadge' in navigator) {
            if (unreadCount > 0) {
                navigator.setAppBadge(unreadCount).catch((e) => console.error("Error setting badge:", e));
            } else {
                navigator.clearAppBadge().catch((e) => console.error("Error clearing badge:", e));
            }
        }
    }, [unreadCount]);

    const enablePush = async () => {
        if (!("Notification" in window) || !("serviceWorker" in navigator)) {
            toast.error("Notifications are not supported by your browser.");
            return;
        }

        try {
            const permission = await Notification.requestPermission();
            setPushEnabled(permission === "granted");

            if (permission === "granted") {
                const registration = await navigator.serviceWorker.ready;
                
                // Get or create subscription
                let subscription = await registration.pushManager.getSubscription();
                
                if (!subscription && VAPID_PUBLIC_KEY) {
                    subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
                    });
                }

                if (subscription && user) {
                    const p256dh = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(subscription.getKey("p256dh")!))));
                    const auth = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(subscription.getKey("auth")!))));

                    const { error } = await supabase.from("push_subscriptions").upsert({
                        user_id: user.id,
                        endpoint: subscription.endpoint,
                        p256dh,
                        auth,
                        updated_at: new Date().toISOString()
                    }, { onConflict: "endpoint" });

                    if (error) console.error("Error saving push subscription:", error);
                    else toast.success("Push notifications fully active!");
                } else if (!VAPID_PUBLIC_KEY) {
                    console.warn("No VAPID_PUBLIC_KEY found in .env. Skipping server-push registration.");
                    toast.success("Notifications enabled (Local-only mode)");
                }
            } else if (permission === "denied") {
                toast.error("Notifications denied. Please enable them in your browser settings.");
            }
        } catch (error) {
            console.error("Error enabling push:", error);
            toast.error("Failed to enable notifications");
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




