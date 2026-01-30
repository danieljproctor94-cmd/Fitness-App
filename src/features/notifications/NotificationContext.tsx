import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

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
    const [notifications, setNotifications] = useState<Notification[]>([
        {
            id: '1',
            title: 'Welcome!',
            message: 'Welcome to your new Fitness Tracker.',
            read: false,
            timestamp: new Date(),
            type: 'success'
        },
        {
            id: '2',
            title: 'Goal Achieved',
            message: 'You hit your daily step goal yesterday!',
            read: true,
            timestamp: new Date(Date.now() - 86400000),
            type: 'info'
        }
    ]);

    const [pushEnabled, setPushEnabled] = useState(false);

    useEffect(() => {
        if ('Notification' in window) {
            setPushEnabled(Notification.permission === 'granted');
        }
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    const enablePush = async () => {
        if (!('Notification' in window)) {
            toast.error('Notifications are not supported by your browser.');
            return;
        }

        const permission = await Notification.requestPermission();
        setPushEnabled(permission === 'granted');

        if (permission === 'granted') {
            toast.success('Push notifications enabled!');
            // Here you would typically subscribe the user to your push service
        } else if (permission === 'denied') {
            toast.error('Notifications denied. Please enable them in your browser settings.');
        }
    };

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n =>
            n.id === id ? { ...n, read: true } : n
        ));
    };

    const clearAll = () => {
        setNotifications([]);
    };

    const addNotification = (notification: Omit<Notification, 'id' | 'read' | 'timestamp'>) => {
        const newNotification: Notification = {
            ...notification,
            id: Math.random().toString(36).substr(2, 9),
            read: false,
            timestamp: new Date()
        };
        setNotifications(prev => [newNotification, ...prev]);
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
