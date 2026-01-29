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
import { Dumbbell, Plus } from 'lucide-react';
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

    // Helper to find workouts for a specific day
    const getWorkoutsForDay = (day: Date) => {
        return workouts.filter(w => w.date === format(day, "yyyy-MM-dd"));
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
                                {dayWorkouts.map((workout) => (
                                    <div
                                        key={workout.id}
                                        className={cn(
                                            "text-[10px] px-2 py-1 rounded-md border truncate flex items-center gap-1.5 transition-colors shadow-sm",
                                            isSelected
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-card text-card-foreground border-border hover:border-primary/50"
                                        )}
                                        title={workout.name}
                                    >
                                        <Dumbbell className={cn("h-3 w-3", isSelected ? "opacity-90" : "text-primary")} />
                                        <span className="truncate font-medium">{workout.name}</span>
                                    </div>
                                ))}

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
