import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { navItems } from "@/lib/navigation";
import { useData } from "@/features/data/DataContext";
import { isSameDay, parseISO } from "date-fns";
import { Plus, ListTodo, Weight, Dumbbell } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function BottomNav() {
    const location = useLocation();
    const { mindsetLogs } = useData();
    const isMindsetLoggedToday = mindsetLogs.some(log => isSameDay(parseISO(log.date), new Date()));

    const filteredItems = navItems.filter(item => item.label !== "Leaderboard" && item.label !== "Support" && item.label !== "Collaboration");

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-safe">
            <nav className="flex items-center justify-around h-16 px-2">
                {filteredItems.map((item) => {
                    if (item.label === "Planner") {
                        return (
                            <DropdownMenu key={item.href}>
                                <DropdownMenuTrigger asChild>
                                    <div className="relative -top-5">
                                        <button
                                            className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                        >
                                            <Plus className="h-8 w-8" />
                                        </button>
                                    </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent side="top" align="center" className="mb-2">
                                    <DropdownMenuItem asChild>
                                        <Link to="/todos" className="flex items-center gap-2 cursor-pointer">
                                            <ListTodo className="h-4 w-4" />
                                            <span>Add Task</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link to="/measurements" className="flex items-center gap-2 cursor-pointer">
                                            <Weight className="h-4 w-4" />
                                            <span>Log Weight</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link to="/workouts" className="flex items-center gap-2 cursor-pointer">
                                            <Dumbbell className="h-4 w-4" />
                                            <span>Add Activity</span>
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        );
                    }

                    return (
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
                    );
                })}
            </nav>
        </div>
    );
}
