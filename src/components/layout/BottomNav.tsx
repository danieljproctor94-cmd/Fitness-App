import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { navItems } from "@/lib/navigation";

import { Plus, ListTodo, Weight, Dumbbell, Home } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


export function BottomNav() {
    const location = useLocation();

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-safe">
            <nav className="flex items-center justify-around h-16 px-2">
                {/* 1. Home */}
                <NavIcon href="/" label="Home" active={location.pathname === "/"} />

                {/* 2. Workouts */}
                <NavIcon href="/workouts" label="Workouts" active={location.pathname.startsWith("/workouts")} />

                {/* 3. Middle Action Button (Plus) */}
                <DropdownMenu>
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

                {/* 4. Measurements */}
                <NavIcon href="/measurements" label="Measurements" active={location.pathname.startsWith("/measurements")} />

                {/* 5. Planner */}
                <NavIcon href="/todos" label="Planner" active={location.pathname.startsWith("/todos")} />
            </nav>
        </div>
    );
}

function NavIcon({ href, label, active }: { href: string; label: string; active: boolean }) {
    const item = navItems.find(i => i.label === label) || { icon: Home }; // Fallback
    const Icon = item.icon;

    return (
        <Link
            to={href}
            className={cn(
                "flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors flex-1 min-w-0",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
        >
            <Icon className={cn(
                "h-6 w-6 mb-1",
                active && "fill-current/20"
            )} />
            <span className="text-[10px] font-medium">
                {label}
            </span>
        </Link>
    );
}
