import { useMemo, useState } from 'react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface BigCalendarProps {
    workouts: Workout[];
    onSelectDate: (date: Date) => void;
    selectedDate: Date;
    currentDate: Date; // Controlled by parent
    view: 'month' | 'week'; // Controlled by parent
}

export function BigCalendar({ workouts, onSelectDate, selectedDate, currentDate, view }: BigCalendarProps) {
    const [viewAllDate, setViewAllDate] = useState<Date | null>(null);

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

    const renderItem = (item: any, isSelected: boolean) => {
        let itemClasses = "bg-card text-card-foreground border-border hover:border-primary/50";
        let isWorkout = true;
        let Icon = Dumbbell;
        let showIcon = true;

        if (item.type === 'todo') {
            isWorkout = false;
            showIcon = false;
            if (item.urgency === 'critical') itemClasses = "bg-red-500/15 text-red-700 border-red-200/50 hover:border-red-300";
            else if (item.urgency === 'high') itemClasses = "bg-orange-500/15 text-orange-700 border-orange-200/50 hover:border-orange-300";
            else if (item.urgency === 'normal' || item.urgency === 'medium') itemClasses = "bg-primary/15 text-primary border-primary/20 hover:border-primary/40";
            else if (item.urgency === 'low') itemClasses = "bg-slate-500/15 text-slate-700 border-slate-200/50 hover:border-slate-300";
        } else if (item.type === 'google_event') {
            isWorkout = false;
            itemClasses = "bg-blue-500/10 text-blue-700 border-blue-200/50 hover:border-blue-300";
            showIcon = false;
        }

        if (isSelected) {
            if (item.type !== 'todo') {
                itemClasses = "bg-primary text-primary-foreground border-primary";
            } else {
                itemClasses += " ring-1 ring-inset ring-black/5";
            }
        }

        if (!isWorkout) {
            let displayTime = item.time;
            if (item.time) {
                const parts = item.time.split(':');
                if (parts.length >= 2) {
                    const h = parseInt(parts[0], 10);
                    const m = parts[1];
                    if (!isNaN(h)) {
                        const ampm = h >= 12 ? 'PM' : 'AM';
                        const h12 = h % 12 || 12;
                        displayTime = `${h12}:${m} ${ampm}`;
                    }
                }
            }
            // Old Compact Design for Planner / ToDos
            return (
                <div
                    key={item.id}
                    className={cn(
                        "text-[10px] px-2 py-1 rounded-md border truncate flex items-center gap-1.5 transition-colors shadow-sm",
                        itemClasses
                    )}
                    title={item.name}
                >
                    {showIcon && <Icon className={cn("h-3 w-3", isSelected ? "opacity-90" : "text-primary")} />}
                    <span className="truncate font-medium flex-1">
                        {displayTime && <span className="font-mono text-[9px] opacity-70 bg-background/30 px-1 py-0.5 rounded-[2px] mr-1 border-r border-border/20 block sm:inline">{displayTime}</span>}
                        {item.name}
                    </span>
                    {item.recurrence && item.recurrence !== "none" && (
                        <div className="flex items-center gap-0.5 opacity-90 shrink-0 ml-1 bg-foreground/5 px-1 py-0.5 rounded-[2px] text-[8px] uppercase tracking-wider leading-none border border-border/20" title={"Repeats " + item.recurrence}>
                            <Repeat className="h-2 w-2" />
                        </div>
                    )}
                </div>
            );
        }

        // New Bigger Design for Workouts
        itemClasses += " hover:shadow-md";
        let timeDisplay = null;
        let timeColorStyles = "bg-background/20 text-foreground/70 border-border/20";
        if (item.time) {
            const h = parseInt(item.time.split(':')[0], 10);
            if (!isNaN(h)) {
                timeDisplay = h < 12 ? 'AM' : 'PM';
                if (h < 12) timeColorStyles = "bg-orange-500/15 text-orange-600 border-orange-500/30";
                else if (h < 17) timeColorStyles = "bg-yellow-500/15 text-yellow-600 border-yellow-500/30";
                else timeColorStyles = "bg-blue-500/15 text-blue-600 border-blue-500/30";
                
                if (isSelected) {
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
                            <span className={cn("font-medium text-[9px] px-1.5 py-0.5 rounded-[4px] border", isSelected ? "bg-background/20 text-primary-foreground border-primary-foreground/20" : "bg-muted text-muted-foreground border-border")}>
                                {item.duration}m
                            </span>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
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

                        const MAX_ITEMS = 2;
                        const displayedWorkouts = dayWorkouts.slice(0, MAX_ITEMS);
                        const hiddenCount = dayWorkouts.length - MAX_ITEMS;

                        return (
                            <div
                                key={day.toString()}
                                onClick={() => onSelectDate(day)}
                                className={cn(
                                    "border-b border-r border-border/50 p-2 relative transition-all duration-200 hover:bg-accent/40 cursor-pointer group flex flex-col gap-1",
                                    !isCurrentMonth && view === 'month' && "bg-muted/5 text-muted-foreground/30",
                                    isSelected && "bg-primary/5 ring-1 ring-inset ring-primary",
                                    dayIdx % 7 === 6 && "border-r-0", // Remove right border on last column
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
                                    {displayedWorkouts.map((item: any) => renderItem(item, isSelected))}

                                    {hiddenCount > 0 && (
                                        <div 
                                            onClick={(e) => { e.stopPropagation(); setViewAllDate(day); }}
                                            className="text-[10px] text-muted-foreground font-medium hover:text-foreground hover:bg-muted/50 p-1 rounded transition-colors text-center cursor-pointer mt-auto bg-muted/20 border border-border/50 truncate"
                                        >
                                            +{hiddenCount} more
                                        </div>
                                    )}

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

            <Dialog open={!!viewAllDate} onOpenChange={(open) => !open && setViewAllDate(null)}>
                <DialogContent className="sm:max-w-[400px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {viewAllDate && format(viewAllDate, "MMMM d, yyyy")}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-2 mt-2">
                        {viewAllDate && getWorkoutsForDay(viewAllDate).map((item: any) => renderItem(item, false))}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
