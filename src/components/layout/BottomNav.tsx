import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { navItems } from "./AppShell";
import { useData } from "@/features/data/DataContext";
import { isSameDay, parseISO } from "date-fns";

export function BottomNav() {
    const location = useLocation();
    const { mindsetLogs } = useData();
    const isMindsetLoggedToday = mindsetLogs.some(log => isSameDay(parseISO(log.date), new Date()));

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-safe">
            <nav className="flex items-center justify-around h-16 px-2">
                {navItems.filter(item => item.label !== "Leaderboard" && item.label !== "Support").map((item) => (
                    <Link
                        key={item.href}
                        to={item.href}
                        className={cn(
                            "flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors flex-1 min-w-0",
                            location.pathname === item.href
                                ? "text-primary"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <item.icon className={cn(
                            "h-6 w-6 mb-1",
                            location.pathname === item.href && "fill-current/20"
                        )} />
                        <span className="text-[10px] font-medium flex items-center gap-1">
                            {item.label}
                            {item.label === "Mindset" && !isMindsetLoggedToday && (
                                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                            )}
                        </span>
                    </Link>
                ))}
            </nav>
        </div>
    );
}
