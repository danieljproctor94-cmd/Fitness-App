import { useMemo } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isToday,
    isSameDay
} from 'date-fns';
import { Dumbbell, Plus, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Workout } from '@/features/data/DataContext';

interface BigCalendarProps {
    workouts: Workout[];
    onSelectDate: (date: Date) => void;
    selectedDate: Date;
    currentDate: Date; // Controlled by parent
    view: 'month' | 'week'; // Controlled by parent
}

export function BigCalendar({ workouts, onSelectDate, selectedDate, currentDate, view }: BigCalendarProps) {

    // Calculate Days based on View
    let startDate, endDate;

    if (view === 'month') {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        startDate = startOfWeek(monthStart);
        endDate = endOfWeek(monthEnd);
    } else {
        // Week View
        startDate = startOfWeek(currentDate);
        endDate = endOfWeek(currentDate);
    }

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Optimization: Group items by date once
    const itemsByDate = useMemo(() => {
        const map: Record<string, any[]> = {};
        workouts.forEach(w => {
            const dateKey = w.date; // already YYYY-MM-DD
            if (!map[dateKey]) map[dateKey] = [];
            map[dateKey].push(w);
        });
        return map;
    }, [workouts]);

    // O(1) Lookup
    const getWorkoutsForDay = (day: Date) => {
        const dateKey = format(day, "yyyy-MM-dd");
        return itemsByDate[dateKey] || [];
    };

    return (
        <div className="flex flex-col h-full border border-border rounded-xl shadow-sm bg-card/50 overflow-hidden">
            {/* Week Days Header */}
            <div className="grid grid-cols-7 border-b border-border text-center py-3 bg-muted/20">
                {weekDays.map((day) => (
                    <div key={day} className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className={cn(
                "grid grid-cols-7 bg-background/50",
                view === 'month' ? "auto-rows-[1fr] h-[600px]" : "auto-rows-[1fr] h-full"
            )}>
                {calendarDays.map((day, dayIdx) => {
                    const dayWorkouts = getWorkoutsForDay(day);
                    const isSelected = isSameDay(day, selectedDate);
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isThisToday = isToday(day);

                    return (
                        <div
                            key={day.toString()}
                            onClick={() => onSelectDate(day)}
                            className={cn(
                                "border-b border-r border-border/50 p-2 relative transition-all duration-200 hover:bg-accent/40 cursor-pointer group flex flex-col gap-1",
                                !isCurrentMonth && view === 'month' && "bg-muted/5 text-muted-foreground/30",
                                isSelected && "bg-primary/5 ring-1 ring-inset ring-primary",
                                dayIdx % 7 === 6 && "border-r-0", // Remove right border on last column
                                // "border-l" logic handled by grid gap usually, but here using borders
                            )}
                        >
                            {/* Date Number */}
                            <div className="flex justify-between items-start">
                                <span className={cn(
                                    "text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full transition-colors",
                                    isThisToday ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground group-hover:text-foreground",
                                    !isCurrentMonth && view === 'month' && "opacity-50"
                                )}>
                                    {format(day, 'd')}
                                </span>
                            </div>

                            {/* Workouts List */}
                            <div className="flex-1 flex flex-col gap-1 mt-1 overflow-hidden">
                                {dayWorkouts.map((item: any) => {
                                    // Determine Styles based on Type & Urgency
                                    let itemClasses = "bg-card text-card-foreground border-border hover:border-primary/50 hover:shadow-md";
                                    let Icon = Dumbbell;
                                    let showIcon = true;

                                    if (item.type === 'todo') {
                                        showIcon = false;
                                        if (item.urgency === 'critical') itemClasses = "bg-red-500/10 text-red-700 border-red-200 hover:border-red-400";
                                        else if (item.urgency === 'high') itemClasses = "bg-orange-500/10 text-orange-700 border-orange-200 hover:border-orange-400";
                                        else if (item.urgency === 'normal' || item.urgency === 'medium') itemClasses = "bg-primary/10 text-primary border-primary/20 hover:border-primary/50";
                                        else if (item.urgency === 'low') itemClasses = "bg-slate-500/10 text-slate-700 border-slate-200 hover:border-slate-400";
                                    } else if (item.type === 'google_event') {
                                        itemClasses = "bg-blue-500/10 text-blue-700 border-blue-200 hover:border-blue-400";
                                        showIcon = false;
                                    }

                                    if (isSelected) {
                                        if (item.type !== 'todo') {
                                            itemClasses = "bg-primary text-primary-foreground border-primary";
                                        } else {
                                            itemClasses += " ring-2 ring-inset ring-black/10";
                                        }
                                    }

                                    let timeDisplay = null;
                                    let timeColorStyles = "bg-background/20 text-foreground/70 border-border/20";
                                    if (item.time) {
                                        const h = parseInt(item.time.split(':')[0], 10);
                                        if (!isNaN(h)) {
                                            timeDisplay = h < 12 ? 'AM' : 'PM';
                                            if (h < 12) timeColorStyles = "bg-orange-500/15 text-orange-600 border-orange-500/30";
                                            else if (h < 17) timeColorStyles = "bg-yellow-500/15 text-yellow-600 border-yellow-500/30";
                                            else timeColorStyles = "bg-blue-500/15 text-blue-600 border-blue-500/30";
                                            
                                            if (isSelected && item.type !== 'todo') {
                                                timeColorStyles = "bg-background/20 text-primary-foreground border-primary-foreground/20";
                                            }
                                        }
                                    }

                                    return (
                                        <div
                                            key={item.id}
                                            className={cn(
                                                "p-2 rounded-lg border flex flex-col gap-1.5 transition-all shadow-sm overflow-hidden",
                                                itemClasses
                                            )}
                                            title={item.name}
                                        >
                                            <div className="flex items-center justify-between gap-1 w-full">
                                                <div className="flex items-center gap-1.5 truncate">
                                                    {showIcon && <Icon className={cn("h-3.5 w-3.5 shrink-0", isSelected ? "opacity-90" : "text-primary/70")} />}
                                                    <span className="truncate font-semibold text-xs">{item.name}</span>
                                                </div>
                                                {item.recurrence && item.recurrence !== "none" && (
                                                    <div className="flex items-center justify-center opacity-80 shrink-0 bg-foreground/10 p-0.5 rounded text-[8px]" title={"Repeats " + item.recurrence}>
                                                        <Repeat className="h-3 w-3" />
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {(timeDisplay || item.duration) && (
                                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                    {timeDisplay && (
                                                        <span className={cn("font-medium text-[9px] px-1.5 py-0.5 rounded-[4px] border", timeColorStyles)}>
                                                            {timeDisplay}
                                                        </span>
                                                    )}
                                                    {item.duration && (
                                                        <span className={cn("font-medium text-[9px] px-1.5 py-0.5 rounded-[4px] border", isSelected && item.type !== 'todo' ? "bg-background/20 text-primary-foreground border-primary-foreground/20" : "bg-muted text-muted-foreground border-border")}>
                                                            {item.duration}m
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Placeholder for "Add" on hover if empty? Optional enhancement */}
                                {dayWorkouts.length === 0 && isSelected && (
                                    <div className="hidden group-hover:flex items-center justify-center h-full opacity-50">
                                        <Plus className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
