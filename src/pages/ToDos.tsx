import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BigCalendar } from "@/components/ui/big-calendar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Bell, RefreshCw, CheckSquare as CheckSquareIcon, Users, Pencil, BarChart3, Activity, ArrowDown, ArrowUp, AlertTriangle, Circle, Mic } from "lucide-react";
import { Link } from "react-router-dom";
import { useData } from "@/features/data/DataContext";
import { format, isSameDay, parseISO, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isBefore, getDay, getDate, startOfDay, getMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import confetti from "canvas-confetti";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import googleIcon from "@/assets/google.png";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNotifications } from "@/features/notifications/NotificationContext";
import { VoiceTaskModal } from "@/components/VoiceTaskModal";




export default function ToDos() {
    const {
        todos,
        addToDo,
        updateToDo,
        deleteToDo,
        isLoading,
        collaborations,
        shareToDo,
        userProfile,
        todoCompletions,
        toggleRecurringCompletion,
        todoExceptions,
        excludeRecurringTask
    } = useData();
    const calendarView = "month";

    // Navigation State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [open, setOpen] = useState(false);

    // Sharing State
    const [sharingId, setSharingId] = useState<string | null>(null);
    const [selectedCollaborators, setSelectedCollaborators] = useState<string[]>([]);

    // Form State
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [time, setTime] = useState("");
    const [recurrence, setRecurrence] = useState<'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('none');
    const [urgency, setUrgency] = useState<'low' | 'normal' | 'high' | 'critical'>('normal');
    const [notify, setNotify] = useState(false);
    const [notifyBefore, setNotifyBefore] = useState<'10_min' | '1_hour' | '1_day'>('10_min');

    const [editingId, setEditingId] = useState<string | null>(null);
    // Delete Confirmation State
    const [todoToDelete, setTodoToDelete] = useState<string | null>(null);
    const [isRecurringDeleteOpen, setIsRecurringDeleteOpen] = useState(false);
    const [recurringTodoToDelete, setRecurringTodoToDelete] = useState<any | null>(null);

    // Load More State for Undated Tasks
    const [visibleUndatedCount, setVisibleUndatedCount] = useState(20);

    const { events: googleEvents, connect: connectGoogle, isConnected: isGoogleConnected, isLoading: isGoogleLoading } = useGoogleCalendar();

    useEffect(() => {
        if (selectedDate && !editingId) {
            setDate(format(selectedDate, "yyyy-MM-dd"));
        }
    }, [selectedDate, editingId]);

    // Voice Modal
    const [voiceModalOpen, setVoiceModalOpen] = useState(false);

    const handleVoiceTasks = async (tasks: { title: string; due_date?: string; due_time?: string }[]) => {
        for (const task of tasks) {
            await addToDo({
                title: task.title,
                description: "Created via Voice",
                due_date: task.due_date || (selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined),
                due_time: task.due_time,
                recurrence: 'none',
                urgency: 'normal',
                notify: !!task.due_time, // Auto-enable notify if time is set
                notify_before: '10_min',
                completed: false

            });
        }
        toast.success(`Added ${tasks.length} tasks from voice`);
    };

    // Navigation Handlers
    const handlePrev = () => {
        setCurrentDate(subMonths(currentDate, 1));
    };

    const handleNext = () => {
        setCurrentDate(addMonths(currentDate, 1));
    };

    const handleToday = () => {
        const now = new Date();
        setCurrentDate(now);
        setSelectedDate(now);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const commonData = {
            title,
            description: description || null,
            due_date: date || null,
            due_time: time || null,
            recurrence: (recurrence as string).toLowerCase() as any,
            urgency,
            notify,
            notify_before: notify ? notifyBefore : null,
        };

        if (editingId) {
            // @ts-ignore
            await updateToDo(editingId, commonData);

            // Handle sharing for edited task
            const originalTask = todos.find(t => t.id === editingId);
            if (originalTask) {
                const originalShares = originalTask.shared_with || [];
                const newShares = selectedCollaborators.filter(id => !originalShares.includes(id));

                for (const friendId of newShares) {
                    await shareToDo(editingId, friendId);
                }
            }
        } else {
            // @ts-ignore
            const newTodo = await addToDo({ ...commonData, completed: false });
            if (newTodo && selectedCollaborators.length > 0) {
                // Share with selected friends
                for (const friendId of selectedCollaborators) {
                    await shareToDo(newTodo.id, friendId);
                }
            }
        }

        setOpen(false);
        resetForm();
    };

    const resetForm = () => {
        setEditingId(null);
        setTitle("");
        setDescription("");
        setDate(format(selectedDate, "yyyy-MM-dd"));
        setTime("");
        setRecurrence('none');
        setUrgency('normal');
        setNotify(false);
        setNotifyBefore('10_min');
        setSelectedCollaborators([]);
    };

    const toggleComplete = async (todo: any, overrideDate?: Date) => {
        const isRecurring = todo.recurrence !== 'none';
        // Use instance date if available (virtual item), otherwise override, otherwise selected
        const targetDateStr = todo.recurrence_instance_date
            ? todo.recurrence_instance_date
            : format(overrideDate || selectedDate, 'yyyy-MM-dd');

        if (isRecurring) {
            // Check if currently completed for this target date
            const isCompletedForDate = todoCompletions.some(tc => tc.todo_id === (todo.original_id || todo.id) && tc.completed_date === targetDateStr);

            // Use original_id if it's a virtual instance, otherwise normal id
            // If it's a completed virtual instance, isCompletedForDate should be true
            // If we are "undoing", we want to set it to false.

            // Logic flip: If it's in the completed list (filteredSideList), it IS completed.
            // If we click it, we want to UN-complete it.

            const idToToggle = todo.original_id || todo.id;

            await toggleRecurringCompletion(idToToggle, targetDateStr, !isCompletedForDate);

            if (!isCompletedForDate) {
                // Completing (restoring completion)
                confetti({
                    particleCount: 50,
                    spread: 50,
                    origin: { y: 0.7 },
                    colors: ['#10B981', '#34D399']
                });
                toast.success("Task completed for " + targetDateStr, {
                    action: {
                        label: "Undo",
                        onClick: () => toggleRecurringCompletion(idToToggle, targetDateStr, false)
                    }
                });
            } else {
                // Un-completing
                toast.success("Recurring instance restored (incomplete)");
            }
        } else {
            // Standard behavior for non-recurring
            const newCompleted = !todo.completed;
            await updateToDo(todo.id, { completed: newCompleted });

            if (newCompleted) {
                confetti({
                    particleCount: 50,
                    spread: 50,
                    origin: { y: 0.7 },
                    colors: ['#10B981', '#34D399']
                });
                toast.success("Task completed", {
                    action: {
                        label: "Undo",
                        onClick: () => updateToDo(todo.id, { completed: false })
                    }
                });
            } else {
                toast.success("Task marked as incomplete");
            }
        }
    };

    const handleShare = async (userId: string) => {
        if (!sharingId) return;
        await shareToDo(sharingId, userId);
        setSharingId(null);
    };

    const toggleCollaboratorSelection = (friendId: string) => {
        setSelectedCollaborators(prev =>
            prev.includes(friendId)
                ? prev.filter(id => id !== friendId)
                : [...prev, friendId]
        );
    };

    const confirmDelete = (todo: any) => {
        if (todo.recurrence !== 'none') {
            setRecurringTodoToDelete(todo);
            setIsRecurringDeleteOpen(true);
        } else {
            setTodoToDelete(todo.id);
        }
    };

    const handleDeleteRecurring = async (mode: 'instance' | 'series') => {
        if (!recurringTodoToDelete) return;

        if (mode === 'instance') {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            await excludeRecurringTask(recurringTodoToDelete.id, dateStr);
            toast.success("This occurrence deleted");
        } else {
            await deleteToDo(recurringTodoToDelete.id);
            toast.success("Recurring series deleted");
        }
        setIsRecurringDeleteOpen(false);
        setRecurringTodoToDelete(null);
    };



        const todosOnSelectedDate = useMemo(() => {
        const filteredTodos = todos.filter(t => {
            // If master task is completed, it shouldn't show up anywhere (archived)
            if (t.completed) return false;

            if (!t.due_date) return false;
            const dueDate = parseISO(t.due_date);

            // If it's a one-time task
            if (t.recurrence === 'none') {
                return isSameDay(dueDate, selectedDate);
            }

            // If it's recurring, check if selectedDate is after or same as due date
            if (isBefore(selectedDate, dueDate) && !isSameDay(selectedDate, dueDate)) {
                return false;
            }

            let isMatch = false;
            if (t.recurrence === 'daily') isMatch = true;
            else if (t.recurrence === 'weekly') isMatch = getDay(dueDate) === getDay(selectedDate);
            else if (t.recurrence === 'monthly') isMatch = getDate(dueDate) === getDate(selectedDate);
            else if (t.recurrence === 'yearly') isMatch = getDate(dueDate) === getDate(selectedDate) && getMonth(dueDate) === getMonth(selectedDate);

            if (isMatch) {
                const dateStr = format(selectedDate, 'yyyy-MM-dd');

                // Check for exclusion (deletion of specific instance)
                const isExcluded = todoExceptions.some(ex => ex.todo_id === t.id && ex.exception_date === dateStr);
                if (isExcluded) return false;

                // If matched, check if it's completed for this specific date
                const isCompletedForDate = todoCompletions.some(tc => tc.todo_id === t.id && tc.completed_date === dateStr);

                // If it is completed for this date, hide it from the "To Do" list
                if (isCompletedForDate) return false;

                return true;
            }

            return false;
        }).map(t => {
            if (t.recurrence !== 'none') {
                 return { ...t, completed: false };
            }
            return t;
        });

        // Mix in Google Events
        const formattedGoogleEvents = (googleEvents || []).reduce((acc: any[], event) => {
             const startStr = event.start.dateTime || event.start.date;
             if (!startStr) return acc;
             
             const eventDate = parseISO(startStr);
             if (isSameDay(eventDate, selectedDate)) {
                 acc.push({
                     id: `g_${event.id}`,
                     title: event.summary || "No Title",
                     description: event.description || "",
                     due_date: format(eventDate, 'yyyy-MM-dd'),
                     due_time: event.start.dateTime ? format(eventDate, 'HH:mm') : undefined,
                     recurrence: 'none',
                     urgency: 'normal',
                     completed: false,
                     isGoogleEvent: true,
                     shared_with: []
                 });
             }
             return acc;
        }, []);

        return [...filteredTodos, ...formattedGoogleEvents].sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            if (a.due_time && b.due_time) return a.due_time.localeCompare(b.due_time);
            if (a.due_time) return -1;
            if (b.due_time) return 1;
            return 0;
        });
    }, [todos, selectedDate, todoCompletions, googleEvents]);

    // List Filter State
    const [listFilter, setListFilter] = useState<'anytime' | 'recurring' | 'overdue' | 'completed'>('anytime');

    // Mobile View State
    const [mobileView, setMobileView] = useState<'list' | 'calendar'>('list');

    const filteredSideList = useMemo(() => {
        const today = startOfDay(new Date());

        if (listFilter === 'anytime') {
            return todos.filter(t => !t.due_date && !t.completed);
        }
        if (listFilter === 'recurring') {
            return todos.filter(t => t.recurrence !== 'none' && !t.completed);
        }
        if (listFilter === 'overdue') {
            return todos.filter(t => {
                if (!t.due_date || t.completed) return false;
                const dueDate = parseISO(t.due_date);
                // Check if strictly before today (ignoring time for simplicity, or include time for correctness)
                return isBefore(dueDate, today);
            });
        }
        if (listFilter === 'completed') {
            // 1. Master completed tasks
            const masterCompleted = todos.filter(t => t.completed);

            // 2. All completed recurring instances
            // We need to create a "virtual" todo item for each completion instance
            const recurringCompletedInstances: any[] = [];

            todos.forEach(t => {
                if (t.recurrence === 'none') return;
                if (t.completed) return; // Already in master list

                // Find all completions for this todo
                const completions = todoCompletions.filter(tc => tc.todo_id === t.id);

                completions.forEach(tc => {
                    recurringCompletedInstances.push({
                        ...t,
                        // Create a specific ID for this instance so React keys don't clash
                        id: `${t.id}_${tc.completed_date}`,
                        original_id: t.id,
                        // It is completed
                        completed: true,
                        // Use the completion date as the effective due date for display/sorting
                        due_date: tc.completed_date,
                        recurrence_instance_date: tc.completed_date
                    });
                });
            });

            const combined = [...masterCompleted, ...recurringCompletedInstances];

            // Sort by date descending (newest first)
            return combined.sort((a, b) => {
                const dateA = a.due_date || a.created_at || '';
                const dateB = b.due_date || b.created_at || '';
                // Handle potential nulls safely, though typical ISO strings sort fine
                return new Date(dateB).getTime() - new Date(dateA).getTime();
            });
        }
        return [];
    }, [todos, listFilter, todoCompletions]);

    const visibleSideList = filteredSideList.slice(0, visibleUndatedCount);

    // Generate Calendar Items (including recurring instances)
    const calendarItems = useMemo(() => {
        const viewStart = startOfMonth(currentDate);
        const viewEnd = endOfMonth(currentDate);
        const items: any[] = [];

        todos.forEach(t => {
            if (!t.due_date) return;
            // Filter out completed tasks from calendar (master completion)
            if (t.completed) return;

            const dueDate = parseISO(t.due_date);

            // Base item structure
            const baseItem = {
                ...t,
                time: t.due_time,
                name: t.title,
                type: 'todo',
                exercises: [],
                duration: '0'
            };

            if (t.recurrence === 'none') {
                items.push({ ...baseItem, date: t.due_date });
            } else {
                // Generate instances for the current view
                const daysInView = eachDayOfInterval({ start: viewStart, end: viewEnd });

                daysInView.forEach(day => {
                    // Must be after or on due date
                    if (isBefore(day, dueDate) && !isSameDay(day, dueDate)) return;

                    let isMatch = false;
                    if (t.recurrence === 'daily') isMatch = true;
                    else if (t.recurrence === 'weekly') isMatch = getDay(dueDate) === getDay(day);
                    else if (t.recurrence === 'monthly') isMatch = getDate(dueDate) === getDate(day);
                    else if (t.recurrence === 'yearly') isMatch = getDate(dueDate) === getDate(day) && getMonth(dueDate) === getMonth(day);

                    if (isMatch) {
                        // Check if completed for this specific date
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const isCompletedForDate = todoCompletions.some(tc => tc.todo_id === t.id && tc.completed_date === dateStr);

                        // If completed, don't show in calendar (or show as completed if desired, but user said "delete")
                        if (isCompletedForDate) return;

                        items.push({
                            ...baseItem,
                            id: `${t.id}_${dateStr}`, // Unique ID for key
                            originalId: t.id,
                            date: dateStr
                        });
                    }
                });
            }
        });

        // Add Google Events
        const gEvents = (googleEvents || [])
            .filter(e => e.start && (e.start.date || e.start.dateTime))
            .map(e => ({
                id: e.id,
                name: e.summary || "No Title",
                date: e.start.date || e.start.dateTime?.split('T')[0] || "",
                time: e.start.dateTime ? format(parseISO(e.start.dateTime), 'HH:mm') : undefined,
                type: 'google_event',
                title: e.summary,
                exercises: [],
                duration: '0'
            }));

        const combinedItems = [...items, ...gEvents];

        // Sort items: No time (all day) first, then by time ascending
        combinedItems.sort((a, b) => {
            // If both have no time, stable sort (or by title if needed)
            if (!a.time && !b.time) return 0;
            // If a has no time (all day), it comes first
            if (!a.time) return -1;
            // If b has no time, it comes first
            if (!b.time) return 1;
            // Both have time, sort ascending
            return a.time.localeCompare(b.time);
        });

        return combinedItems;
    }, [todos, currentDate, googleEvents, todoCompletions]);

    // Stats Logic
    const todayCount = useMemo(() => {
        const today = new Date();
        const dateStr = format(today, 'yyyy-MM-dd');

        return todos.filter(t => {
            if (t.completed) return false;
            if (!t.due_date) return false;

            const dueDate = parseISO(t.due_date);

            if (t.recurrence === 'none') {
                return isSameDay(dueDate, today);
            } else {
                // Check recurrence match
                if (isBefore(today, dueDate) && !isSameDay(today, dueDate)) return false;

                let isMatch = false;
                if (t.recurrence === 'daily') isMatch = true;
                else if (t.recurrence === 'weekly') isMatch = getDay(dueDate) === getDay(today);
                else if (t.recurrence === 'monthly') isMatch = getDate(dueDate) === getDate(today);
                else if (t.recurrence === 'yearly') isMatch = getDate(dueDate) === getDate(today) && getMonth(dueDate) === getMonth(today);

                if (!isMatch) return false;

                // Check if completed for today
                const isCompletedForDate = todoCompletions.some(tc => tc.todo_id === t.id && tc.completed_date === dateStr);
                return !isCompletedForDate;
            }
        }).length;
    }, [todos, todoCompletions]);

    const acceptedFriends = collaborations.filter(c => c.status === 'accepted');

    const { enablePush, pushEnabled } = useNotifications();

    return (
        <div className="flex flex-col p-4 md:p-6 gap-6">
            <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
                {/* Left Side: Analytics & Sync */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full xl:w-auto">
                    {/* Analytics Pills */}
                    <div className="flex items-center gap-2 mr-2">
                        <Link to="/planner/analytics">
                            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground hover:text-white transition-colors">
                                <BarChart3 className="h-4 w-4" />
                                <span className="text-xs font-medium">Analytics</span>
                            </Button>
                        </Link>
                        <div className="h-4 w-px bg-border mx-1" />
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card text-xs font-medium text-muted-foreground whitespace-nowrap">
                            <Activity className="h-3.5 w-3.5 text-emerald-500" />
                            <span>{todayCount} Tasks Due</span>
                        </div>
                    </div>

                    <div className="h-8 w-px bg-border/60 hidden xl:block" />

                    {/* Sync Button (Primary Action Style) */}
                    <Button
                        onClick={connectGoogle}
                        disabled={isGoogleLoading}
                        className={cn(
                            "gap-2 font-medium transition-all h-10 px-6 w-full sm:w-auto",
                            isGoogleConnected
                                ? "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
                                : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                        )}
                    >
                        {isGoogleLoading ? (
                            <>
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                <span>Syncing...</span>
                            </>
                        ) : isGoogleConnected ? (
                            <>
                                <img src={googleIcon} alt="G" className="h-4 w-4" />
                                <span>Synced</span>
                            </>
                        ) : (
                            <>
                                <Plus className="h-4 w-4" />
                                <span>Sync Calendar</span>
                            </>
                        )}
                    </Button>
                </div>

                {/* Right Side: Date Navigation (Desktop) */}
                <div className="flex items-center gap-2 w-full xl:w-auto justify-between xl:justify-end">


                    <div className={cn(
                        "flex items-center gap-2 w-full xl:w-auto justify-between xl:justify-end",
                        mobileView === 'list' ? "hidden lg:flex" : "flex"
                    )}>
                        <div className="flex items-center gap-2 w-full justify-between lg:justify-end">
                            <Button variant="outline" size="icon" onClick={handlePrev} className="h-10 w-10 border-border/60">
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="secondary" size="sm" onClick={handleToday} className="h-10 font-medium px-5 border border-border/50 bg-card hover:bg-muted min-w-[120px]">
                                {format(currentDate, "MMMM")}
                            </Button>
                            <Button variant="outline" size="icon" onClick={handleNext} className="h-10 w-10 border-border/60">
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile View Toggle (Full Width Row) */}
            <div className="flex lg:hidden bg-muted/50 p-1 rounded-lg w-full shrink-0">
                <button
                    onClick={() => setMobileView('list')}
                    className={cn(
                        "flex-1 text-xs font-medium py-1.5 rounded-md transition-all",
                        mobileView === 'list' ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    List
                </button>
                <button
                    onClick={() => setMobileView('calendar')}
                    className={cn(
                        "flex-1 text-xs font-medium py-1.5 rounded-md transition-all",
                        mobileView === 'calendar' ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Calendar
                </button>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                {/* Trigger moved to task list */}
                <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">

                    <form onSubmit={handleSubmit} className="grid gap-5 py-4 pt-6">
                        <div className="grid gap-2">
                            <Label>Task Name</Label>
                            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Buy Groceries" required />
                        </div>

                        {/* Compact Grid for Settings */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="grid gap-1.5">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs text-muted-foreground">Date <span className="font-normal opacity-70">(Optional)</span></Label>
                                    {date && (
                                        <button type="button" onClick={() => setDate("")} className="text-[10px] text-primary hover:text-primary/80 font-medium">
                                            Clear
                                        </button>
                                    )}
                                </div>
                                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10 text-base md:text-sm w-full appearance-none" style={{ colorScheme: "dark" }} />
                            </div>
                            <div className="grid gap-1.5">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs text-muted-foreground">Time <span className="font-normal opacity-70">(Optional)</span></Label>
                                    {time && time !== "none" && (
                                        <button type="button" onClick={() => setTime("none")} className="text-[10px] text-primary hover:text-primary/80 font-medium">
                                            Clear
                                        </button>
                                    )}
                                </div>
                                <Input
                                    type="time"
                                    value={time === "none" ? "" : time}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="h-10 text-base md:text-sm w-full appearance-none"
                                    style={{ colorScheme: "dark" }}
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label className="text-xs text-muted-foreground">Urgency</Label>
                                <Select value={urgency} onValueChange={(val: any) => setUrgency(val)}>
                                    <SelectTrigger className="h-10 text-base md:text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">
                                            <div className="flex items-center gap-2">
                                                <ArrowDown className="h-3.5 w-3.5 text-slate-500" />
                                                <span className="text-slate-600">Low</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="normal">
                                            <div className="flex items-center gap-2">
                                                <Circle className="h-3.5 w-3.5 text-primary fill-primary/20" />
                                                <span className="text-primary">Normal</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="high">
                                            <div className="flex items-center gap-2">
                                                <ArrowUp className="h-3.5 w-3.5 text-orange-500" />
                                                <span className="text-orange-600">High</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="critical">
                                            <div className="flex items-center gap-2">
                                                <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                                                <span className="text-red-600">Critical</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-1.5">
                                <Label className="text-xs text-muted-foreground">Recurrence</Label>
                                <Select value={recurrence} onValueChange={(val: any) => setRecurrence(val)}>
                                    <SelectTrigger className="h-10 text-base md:text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        <SelectItem value="daily">Daily</SelectItem>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                        <SelectItem value="yearly">Yearly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label>Description <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Details..." className="resize-none h-20 text-sm" />
                        </div>

                        {/* Collapsed Sections Container */}
                        <div className="space-y-4 pt-2">
                            {/* Team */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium flex items-center gap-2">
                                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                        Share with Team
                                    </Label>
                                    {selectedCollaborators.length > 0 && (
                                        <span className="text-xs text-primary font-medium">{selectedCollaborators.length} selected</span>
                                    )}
                                </div>
                                {acceptedFriends.length > 0 ? (
                                    <div className="flex gap-2 flex-wrap">
                                        {acceptedFriends.map((friend) => {
                                            const friendId = friend.profile?.id || friend.receiver_id;
                                            const isSelected = selectedCollaborators.includes(friendId);
                                            return (
                                                <div
                                                    key={friend.id}
                                                    onClick={() => toggleCollaboratorSelection(friendId)}
                                                    className={cn(
                                                        "flex items-center gap-2 px-2 py-1.5 rounded-md border cursor-pointer transition-all",
                                                        isSelected ? "bg-primary/15 border-primary/30 text-primary" : "bg-muted/30 border-transparent hover:bg-muted"
                                                    )}
                                                >
                                                    <Avatar className="h-5 w-5">
                                                        <AvatarImage src={friend.profile?.photoURL} />
                                                        <AvatarFallback className="text-[9px]">{friend.profile?.displayName?.[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-xs font-medium truncate max-w-[80px]">{friend.profile?.displayName?.split(' ')[0]}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground italic pl-1">No team members available.</p>
                                )}
                            </div>

                            {/* Notifications */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Bell className="h-3.5 w-3.5 text-muted-foreground" />
                                    <Label htmlFor="notify" className="text-sm font-medium cursor-pointer">Reminders</Label>
                                </div>
                                <div className="flex items-center gap-3">
                                    {notify && (
                                        <Select value={notifyBefore} onValueChange={(val: any) => setNotifyBefore(val)}>
                                            <SelectTrigger className="w-[110px] h-7 text-[10px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="10_min">10 Min Before</SelectItem>
                                                <SelectItem value="1_hour">1 Hour Before</SelectItem>
                                                <SelectItem value="1_day">1 Day Before</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                    <Switch id="notify" checked={notify} onCheckedChange={async (checked) => {
                                        setNotify(checked);
                                        if (checked && !pushEnabled) {
                                            await enablePush();
                                        }
                                    }} />
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="submit" className="w-full sm:w-auto">{editingId ? "Update Task" : "Save Task"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Share Dialog */}
            <Dialog open={!!sharingId} onOpenChange={(open) => !open && setSharingId(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Share Task</DialogTitle>
                        <DialogDescription>
                            Select a friend to collaborate on this task with.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3 py-4 max-h-[300px] overflow-y-auto">
                        {acceptedFriends.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                                You don't have any friends to share with yet.
                            </p>
                        ) : (
                            acceptedFriends.map(friend => (
                                <Button
                                    key={friend.id}
                                    variant="outline"
                                    className="justify-start h-auto py-3 px-4"
                                    onClick={() => handleShare(friend.profile?.id || friend.receiver_id)}
                                >
                                    <Avatar className="h-8 w-8 mr-3">
                                        <AvatarImage src={friend.profile?.photoURL} />
                                        <AvatarFallback>{friend.profile?.displayName?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="text-left">
                                        <div className="font-semibold text-sm">{friend.profile?.displayName}</div>
                                        <div className="text-xs text-muted-foreground">Teammate</div>
                                    </div>
                                </Button>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!todoToDelete} onOpenChange={(open) => !open && setTodoToDelete(null)}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Delete Task</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this task? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="grid grid-cols-2 gap-2 mt-2">
                        <Button variant="outline" onClick={() => setTodoToDelete(null)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={async () => {
                                if (todoToDelete) {
                                    await deleteToDo(todoToDelete);
                                    setTodoToDelete(null);
                                }
                            }}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>



            <div className="flex-1 flex flex-col xl:flex-row gap-4 min-h-0">
                <div className={cn(
                    "w-full xl:w-80 flex-none flex flex-col gap-4 border xl:border-r border-border/50 bg-card rounded-xl xl:rounded-r-none xl:bg-background xl:border-t-0 xl:border-b-0 xl:border-l-0 xl:shadow-none shadow-sm p-4 min-h-0",
                    mobileView === 'calendar' ? "hidden xl:flex" : "flex"
                )}>
                    <div className="flex items-center justify-between shrink-0 mb-1 lg:mb-2 lg:pt-2">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5 text-primary" />
                            {isSameDay(selectedDate, new Date()) ? `Today, ${format(selectedDate, "MMM do")}` : format(selectedDate, "MMM do")}
                        </h3>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => setVoiceModalOpen(true)}
                                size="sm"
                                className="relative overflow-hidden h-8 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0 shadow-md transition-all hover:scale-105 px-4"
                            >
                                <div className="flex items-center gap-1.5">
                                    <Mic className="h-3.5 w-3.5 text-indigo-200" />
                                    <span className="text-xs font-semibold">Voice AI</span>
                                </div>
                                <span className="absolute top-0 right-0 bg-white/20 text-[6px] font-extrabold px-1.5 py-[2px] rounded-bl-md text-indigo-100 leading-none tracking-wider">BETA</span>
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin">
                        <div className="mb-6">
                            <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider pl-1">Scheduled</h4>

                            {isLoading ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-24 w-full" />
                                    <Skeleton className="h-24 w-full" />
                                    <Skeleton className="h-24 w-full" />
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {/* Add Task Placeholder */}
                                    <div
                                        onClick={() => {
                                            resetForm();
                                            if (selectedDate) setDate(format(selectedDate, "yyyy-MM-dd"));
                                            setOpen(true);
                                        }}
                                        className="group relative flex items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-xl p-4 cursor-pointer hover:bg-muted/10 hover:border-muted-foreground/40 transition-all min-h-[74px]"
                                    >
                                        <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
                                            <div className="h-8 w-8 rounded-full bg-muted/30 flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                                                <Plus className="h-4 w-4" />
                                            </div>
                                            <span className="font-medium text-sm">Add New Task</span>
                                        </div>
                                    </div>

                                    {todosOnSelectedDate.map((todo: any) => (
                                        <Card key={todo.id} className={cn(
                                            "shadow-none border transition-all group relative overflow-hidden",
                                            todo.completed ? "bg-muted/20 border-border/50 opacity-60" : "bg-card/40 border-border/60 hover:bg-card hover:border-emerald-500/30",
                                            !todo.completed && todo.urgency === 'critical' ? 'border-l-4 border-l-red-500' :
                                                !todo.completed && todo.urgency === 'high' ? 'border-l-4 border-l-orange-500' :
                                                    !todo.completed && (todo.urgency === 'normal' || (todo.urgency as any) === 'medium') ? 'border-l-4 border-l-primary' :
                                                        !todo.completed && todo.urgency === 'low' ? 'border-l-4 border-l-slate-400' : ''
                                        )}>
                                            <CardContent className="p-3">
                                                <div className="flex items-start gap-3">
                                                    <button
                                                        onClick={() => toggleComplete(todo)}
                                                        className={cn(
                                                            "mt-1 h-5 w-5 rounded border flex items-center justify-center shrink-0 transition-colors",
                                                            todo.completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-muted-foreground/30 hover:border-emerald-500"
                                                        )}
                                                    >
                                                        {todo.completed && <CheckSquareIcon className="h-3.5 w-3.5" />}
                                                    </button>
                                                    <div className="flex-1 min-w-0 space-y-1">
                                                        <div className="flex items-center justify-between">
                                                            <p className={cn("text-sm font-medium leading-none truncate", todo.completed && "line-through text-muted-foreground", todo.isGoogleEvent && "text-blue-400")}>
                                                                {todo.title}
                                                            </p>

                                                        </div>
                                                        {todo.description && (
                                                            <p className="text-xs text-muted-foreground line-clamp-2">{todo.description}</p>
                                                        )}

                                                        {/* Avatar Stack / Empty State */}
                                                        <div className="flex items-center mt-2">
                                                            {todo.shared_with && todo.shared_with.length > 0 ? (
                                                                <div className="flex -space-x-2 overflow-hidden">
                                                                    {/* User Avatar */}
                                                                    <Avatar className="inline-block h-6 w-6 rounded-full ring-2 ring-background">
                                                                        <AvatarImage src={userProfile?.photoURL} />
                                                                        <AvatarFallback className="text-[9px]">{userProfile?.displayName?.[0] || 'U'}</AvatarFallback>
                                                                    </Avatar>
                                                                    {/* Collaborator Avatars */}
                                                                    {todo.shared_with.map((userId: string) => {
                                                                        const collaborator = acceptedFriends.find(c => (c.profile?.id === userId || c.receiver_id === userId || c.requester_id === userId));
                                                                        const profile = collaborator?.profile || (collaborations.find(c => c.receiver_id === userId || c.requester_id === userId)?.profile);

                                                                        // Fallback if we can't find the profile immediately (though we should have it)
                                                                        if (!profile) return null;

                                                                        return (
                                                                            <Avatar key={userId} className="inline-block h-6 w-6 rounded-full ring-2 ring-background">
                                                                                <AvatarImage src={profile.photoURL} />
                                                                                <AvatarFallback className="text-[9px]">{profile.displayName?.[0]}</AvatarFallback>
                                                                            </Avatar>
                                                                        );
                                                                    })}
                                                                </div>
                                                            ) : !todo.isGoogleEvent ? (
                                                                <div className="flex items-center -space-x-1.5">
                                                                    <Avatar className="h-6 w-6 rounded-full border-2 border-background ring-1 ring-border/10">
                                                                        <AvatarImage src={userProfile?.photoURL} className="object-cover" />
                                                                        <AvatarFallback className="text-[9px] bg-muted text-muted-foreground">
                                                                            {userProfile?.displayName?.[0] || 'U'}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setSharingId(todo.id);
                                                                        }}
                                                                        className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-muted hover:bg-muted/80 border-2 border-background ring-1 ring-border/10 transition-colors"
                                                                    >
                                                                        <Plus className="h-3 w-3 text-muted-foreground" />
                                                                    </button>
                                                                </div>
                                                            ) : null} 
                                                        </div>
                                                        <div className="flex items-center gap-2 pt-1 text-[10px] text-muted-foreground">
                                                            {todo.due_time && (
                                                                <span className="flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded">
                                                                    <Clock className="h-3 w-3" /> {
                                                                        (() => {
                                                                            const [h, m] = todo.due_time.split(':');
                                                                            const hour = parseInt(h);
                                                                            const ampm = hour >= 12 ? 'PM' : 'AM';
                                                                            const displayHour = hour % 12 || 12;
                                                                            return `${displayHour}:${m} ${ampm}`;
                                                                        })()
                                                                    }
                                                                </span>
                                                            )}
                                                            {todo.recurrence !== 'none' && (
                                                                <span className="flex items-center gap-1 bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded capitalize">
                                                                    <RefreshCw className="h-3 w-3" /> {todo.recurrence}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-1 transition-opacity">
                                                        {todo.isGoogleEvent ? (
                                                             <div className="bg-muted/30 p-1.5 rounded-md text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                                                                 G-Cal
                                                             </div>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingId(todo.id);
                                                                setTitle(todo.title);
                                                                setDescription(todo.description || "");
                                                                setDate(todo.due_date || "");
                                                                const rawTime = todo.due_time || "";
                                                                setTime(rawTime.slice(0, 5));
                                                                setRecurrence(todo.recurrence);
                                                                setUrgency(((todo.urgency as any) === 'medium' ? 'normal' : todo.urgency) || 'normal');
                                                                setNotify(todo.notify);
                                                                setNotifyBefore(todo.notify_before || '10_min');
                                                                setSelectedCollaborators(todo.shared_with || []);
                                                                setOpen(true);
                                                            }}
                                                            className="p-1 hover:bg-muted rounded text-xs"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                confirmDelete(todo);
                                                            }}
                                                            className="p-1 hover:bg-red-500/10 hover:text-red-500 rounded text-xs text-muted-foreground hover:text-white transition-colors"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col pr-2 space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    {listFilter === 'anytime' ? 'Anytime' :
                                        listFilter === 'recurring' ? 'Recurring' :
                                            listFilter === 'completed' ? 'Completed' : 'Overdue'}
                                </h4>
                                <Select value={listFilter} onValueChange={(v: any) => {
                                    setListFilter(v);
                                    setVisibleUndatedCount(20); // Reset visible count on filter change
                                }}>
                                    <SelectTrigger className="h-6 w-[100px] text-[10px] px-2 py-0 border-0 bg-transparent hover:bg-muted/50 focus:ring-0 shadow-none justify-end gap-1">
                                        <span className="truncate">Filter</span>
                                    </SelectTrigger>
                                    <SelectContent align="end">
                                        <SelectItem value="anytime">Anytime</SelectItem>
                                        <SelectItem value="recurring">Recurring</SelectItem>
                                        <SelectItem value="overdue">Overdue</SelectItem>
                                        <div className="h-px bg-border my-1" />
                                        <SelectItem value="completed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                {isLoading ? (
                                    <div className="space-y-3">
                                        <Skeleton className="h-24 w-full" />
                                        <Skeleton className="h-24 w-full" />
                                        <Skeleton className="h-24 w-full" />
                                    </div>
                                ) : visibleSideList.map((todo: any) => (
                                    <Card key={todo.id} className={cn(
                                        "shadow-none border transition-all group relative overflow-hidden",
                                        todo.completed ? "bg-muted/20 border-border/50 opacity-60" : "bg-card/40 border-border/60 hover:bg-card hover:border-emerald-500/30",
                                        !todo.completed && todo.urgency === 'critical' ? 'border-l-4 border-l-red-500' :
                                            !todo.completed && todo.urgency === 'high' ? 'border-l-4 border-l-orange-500' :
                                                !todo.completed && (todo.urgency === 'normal' || (todo.urgency as any) === 'medium') ? 'border-l-4 border-l-primary' :
                                                    !todo.completed && todo.urgency === 'low' ? 'border-l-4 border-l-slate-400' : ''
                                    )}>
                                        <CardContent className="p-3">
                                            <div className="flex items-start gap-3">
                                                <button
                                                    onClick={() => toggleComplete(todo, listFilter === 'completed' ? new Date() : undefined)}
                                                    className={cn(
                                                        "mt-1 h-5 w-5 rounded border flex items-center justify-center shrink-0 transition-colors",
                                                        todo.completed ? "bg-muted text-muted-foreground border-transparent hover:bg-muted/80" : "border-muted-foreground/30 hover:border-emerald-500"
                                                    )}
                                                    title={todo.completed ? "Undo completion" : "Mark as completed"}
                                                >
                                                    {todo.completed ? <RefreshCw className="h-3 w-3" /> : null}
                                                </button>
                                                <div className="flex-1 min-w-0 space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <p className={cn("text-sm font-medium leading-none truncate", todo.completed && "line-through text-muted-foreground", todo.isGoogleEvent && "text-blue-400")}>
                                                            {todo.title}
                                                        </p>

                                                    </div>
                                                    {todo.description && (
                                                        <p className="text-xs text-muted-foreground line-clamp-2">{todo.description}</p>
                                                    )}

                                                    {/* Avatar Stack / Empty State - Side List */}
                                                    <div className="flex items-center mt-2">
                                                        {todo.shared_with && todo.shared_with.length > 0 ? (
                                                            <div className="flex -space-x-2 overflow-hidden">
                                                                {/* User Avatar */}
                                                                <Avatar className="inline-block h-6 w-6 rounded-full ring-2 ring-background">
                                                                    <AvatarImage src={userProfile?.photoURL} />
                                                                    <AvatarFallback className="text-[9px]">{userProfile?.displayName?.[0] || 'U'}</AvatarFallback>
                                                                </Avatar>
                                                                {/* Collaborator Avatars */}
                                                                {todo.shared_with.map((userId: string) => {
                                                                    const collaborator = acceptedFriends.find(c => (c.profile?.id === userId || c.receiver_id === userId || c.requester_id === userId));
                                                                    const profile = collaborator?.profile || (collaborations.find(c => c.receiver_id === userId || c.requester_id === userId)?.profile);

                                                                    if (!profile) return null;

                                                                    return (
                                                                        <Avatar key={userId} className="inline-block h-6 w-6 rounded-full ring-2 ring-background">
                                                                            <AvatarImage src={profile.photoURL} />
                                                                            <AvatarFallback className="text-[9px]">{profile.displayName?.[0]}</AvatarFallback>
                                                                        </Avatar>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center -space-x-1.5">
                                                                <Avatar className="h-6 w-6 rounded-full border-2 border-background ring-1 ring-border/10">
                                                                    <AvatarImage src={userProfile?.photoURL} className="object-cover" />
                                                                    <AvatarFallback className="text-[9px] bg-muted text-muted-foreground">
                                                                        {userProfile?.displayName?.[0] || 'U'}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSharingId(todo.id);
                                                                    }}
                                                                    className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-muted hover:bg-muted/80 border-2 border-background ring-1 ring-border/10 transition-colors"
                                                                >
                                                                    <Plus className="h-3 w-3 text-muted-foreground" />
                                                                </button>
                                                                </div>
                                                            )} 
                                                        </div>
                                                    <div className="flex items-center gap-2 pt-1 text-[10px] text-muted-foreground">
                                                        {todo.due_time && (
                                                            <span className="flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded">
                                                                <Clock className="h-3 w-3" /> {
                                                                    (() => {
                                                                        const [h, m] = todo.due_time.split(':');
                                                                        const hour = parseInt(h);
                                                                        const ampm = hour >= 12 ? 'PM' : 'AM';
                                                                        const displayHour = hour % 12 || 12;
                                                                        return `${displayHour}:${m} ${ampm}`;
                                                                    })()
                                                                }
                                                            </span>
                                                        )}
                                                        {todo.recurrence !== 'none' && (
                                                            <span className="flex items-center gap-1 bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded capitalize">
                                                                <RefreshCw className="h-3 w-3" /> {todo.recurrence}
                                                            </span>
                                                        )}
                                                        {listFilter === 'overdue' && todo.due_date && (
                                                            <span className="flex items-center gap-1 bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded">
                                                                <CalendarIcon className="h-3 w-3" /> {format(parseISO(todo.due_date), 'MMM d')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1 transition-opacity">
                                                    {todo.completed && (
                                                        <button
                                                            onClick={() => toggleComplete(todo, listFilter === 'completed' ? new Date() : undefined)}
                                                            className="p-1 hover:bg-primary/10 hover:text-primary rounded text-xs text-muted-foreground transition-colors"
                                                            title="Undo completion"
                                                        >
                                                            <RefreshCw className="h-3.5 w-3.5" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => {
                                                            setEditingId(todo.id);
                                                            setTitle(todo.title);
                                                            setDescription(todo.description || "");
                                                            setDate(todo.due_date || "");
                                                            const rawTime = todo.due_time || "";
                                                            setTime(rawTime.slice(0, 5));
                                                            setRecurrence(todo.recurrence);
                                                            setUrgency(((todo.urgency as any) === 'medium' ? 'normal' : todo.urgency) || 'normal');
                                                            setNotify(todo.notify);
                                                            setNotifyBefore(todo.notify_before || '10_min');
                                                            setSelectedCollaborators(todo.shared_with || []);
                                                            setOpen(true);
                                                        }}
                                                        className="p-1 hover:bg-muted rounded text-xs"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => confirmDelete(todo)}
                                                        className="p-1 hover:bg-red-500/10 hover:text-red-500 rounded text-xs text-muted-foreground hover:text-white transition-colors"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                </button>
</div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {filteredSideList.length > visibleUndatedCount && (
                                <Button
                                    variant="ghost"
                                    className="w-full mt-2 text-xs text-muted-foreground hover:text-primary"
                                    onClick={() => setVisibleUndatedCount(prev => prev + 20)}
                                >
                                    Load More ({filteredSideList.length - visibleUndatedCount} remaining)
                                </Button>
                            )}

                            {filteredSideList.length === 0 && (
                                <div className="text-center p-4 text-xs text-muted-foreground italic">
                                    {listFilter === 'anytime' ? "No anytime tasks" :
                                        listFilter === 'recurring' ? "No recurring tasks" :
                                            listFilter === 'completed' ? "No completed tasks found" :
                                                "No overdue tasks"}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className={cn(
                    "flex-1 min-h-0 flex-col bg-card/20 rounded-xl overflow-hidden shadow-sm border border-border/50 relative",
                    mobileView === 'list' ? "hidden lg:flex" : "flex"
                )}>

                    {/* @ts-ignore */}
                    <BigCalendar
                        workouts={calendarItems as any}
                        selectedDate={selectedDate}
                        onSelectDate={(date) => {
                            setSelectedDate(date);
                            // On mobile, switch to list view when date is selected to show tasks
                            if (window.innerWidth < 1024) {
                                setMobileView('list');
                            }
                        }}
                        currentDate={currentDate}
                        view={calendarView}
                    />
                </div>
            </div>
            {/* Recurring Delete Dialog */}
            <Dialog open={isRecurringDeleteOpen} onOpenChange={setIsRecurringDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Recurring Task</DialogTitle>
                        <DialogDescription>
                            Do you want to delete only this occurrence or the entire series?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRecurringDeleteOpen(false)}>Cancel</Button>
                        <Button variant="outline" onClick={() => handleDeleteRecurring('instance')}>
                            Delete This Occurrence
                        </Button>
                        <Button variant="destructive" onClick={() => handleDeleteRecurring('series')}>
                            Delete Entire Series
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <VoiceTaskModal
                isOpen={voiceModalOpen}
                onClose={() => setVoiceModalOpen(false)}
                onAddTasks={handleVoiceTasks}
            />
        </div >
    );
}


