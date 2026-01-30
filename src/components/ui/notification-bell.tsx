import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/features/notifications/NotificationContext";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export function NotificationBell() {
    const { notifications, unreadCount, markAsRead, clearAll } = useNotifications();

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold text-sm">Notifications</h4>
                    {notifications.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs h-8 px-2">
                            Clear all
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground space-y-2">
                            <Check className="h-8 w-8 opacity-20" />
                            <p className="text-sm">You are up to date!</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "p-4 hover:bg-muted/50 transition-colors cursor-pointer",
                                        !notification.read && "bg-muted/20"
                                    )}
                                    onClick={() => markAsRead(notification.id)}
                                >
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="space-y-1">
                                            <p className={cn("text-sm font-medium", !notification.read && "text-primary")}>
                                                {notification.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground/60">
                                                {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                                            </p>
                                        </div>
                                        {!notification.read && (
                                            <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
