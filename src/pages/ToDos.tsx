import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BigCalendar } from "@/components/ui/big-calendar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Bell, RefreshCw, CheckSquare as CheckSquareIcon, CheckSquare, Users, Share2 } from "lucide-react";
import { useData, ToDo } from "@/features/data/DataContext";
import { format, isSameDay, parseISO, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isBefore, getDay, getDate, startOfDay } from "date-fns";
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

const timeOptions = Array.from({ length: 24 }).map((_, i) => {
    const hour = i;
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    const value = `${hour.toString().padStart(2, '0')}:00`;
    const label = `${displayHour}:00 ${ampm}`;
    return { value, label };
});

export default function ToDos() {
    const { todos, addToDo, updateToDo, deleteToDo, isLoading, collaborations, shareToDo } = useData();
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
    const [recurrence, setRecurrence] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
    const [urgency, setUrgency] = useState<'low' | 'normal' | 'high' | 'critical'>('normal');
    const [notify, setNotify] = useState(false);
    const [notifyBefore, setNotifyBefore] = useState<'10_min' | '1_hour' | '1_day'>('10_min');

    const [editingId, setEditingId] = useState<string | null>(null);

    // Load More State for Undated Tasks
    const [visibleUndatedCount, setVisibleUndatedCount] = useState(20);

    const { events: googleEvents, connect: connectGoogle, isConnected: isGoogleConnected } = useGoogleCalendar();

    useEffect(() => {
        if (selectedDate && !editingId) {
            setDate(format(selectedDate, "yyyy-MM-dd"));
        }
    }, [selectedDate, editingId]);

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

        const todoData = {
            title,
            description,
            due_date: date || undefined,
            due_time: time || undefined,
            recurrence,
            urgency,
            notify,
            notify_before: notify ? notifyBefore : undefined,
            completed: false
        };

        if (editingId) {
            // @ts-ignore
            await updateToDo(editingId, todoData);
        } else {
            // @ts-ignore
            const newTodo = await addToDo(todoData);
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

    const toggleComplete = async (todo: ToDo) => {
        const newCompleted = !todo.completed;
        await updateToDo(todo.id, { completed: newCompleted });

        if (newCompleted) {
            confetti({
                particleCount: 50,
                spread: 50,
                origin: { y: 0.7 },
                colors: ['#10B981', '#34D399']
            });
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

    const todosOnSelectedDate = todos.filter(t => {
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

        // Check recurrence rules
        if (t.recurrence === 'daily') return true;
        if (t.recurrence === 'weekly') return getDay(dueDate) === getDay(selectedDate);
        if (t.recurrence === 'monthly') return getDate(dueDate) === getDate(selectedDate);

        return false;
    });

    todosOnSelectedDate.sort((a, b) => {
        if (a.due_time && b.due_time) return a.due_time.localeCompare(b.due_time);
        if (a.due_time) return -1;
        if (b.due_time) return 1;
        return 0;
    });

    // List Filter State
    const [listFilter, setListFilter] = useState<'anytime' | 'recurring' | 'overdue'>('anytime');

    // Mobile View State
    const [mobileView, setMobileView] = useState<'list' | 'calendar'>('list');

    const filteredSideList = useMemo(() => {
        const today = startOfDay(new Date());

        if (listFilter === 'anytime') {
            return todos.filter(t => !t.due_date && !t.completed);
        }
        if (listFilter === 'recurring') {
            return todos.filter(t => t.recurrence !== 'none');
        }
        if (listFilter === 'overdue') {
            return todos.filter(t => {
                if (!t.due_date || t.completed) return false;
                const dueDate = parseISO(t.due_date);
                // Check if strictly before today (ignoring time for simplicity, or include time if needed)
                // Using startOfToday comparison
                return isBefore(dueDate, today);
            });
        }
        return [];
    }, [todos, listFilter]);

    const visibleSideList = filteredSideList.slice(0, visibleUndatedCount);

    // Generate Calendar Items (including recurring instances)
    const calendarItems = useMemo(() => {
        const viewStart = startOfMonth(currentDate);
        const viewEnd = endOfMonth(currentDate);
        const items: any[] = [];

        todos.forEach(t => {
            if (!t.due_date) return;
            const dueDate = parseISO(t.due_date);

            // Base item structure
            const baseItem = {
                ...t,
                name: t.title,
                type: 'todo',
                exercises: [],
                duration: '0'
            };

            if (t.recurrence === 'none') {
                items.push({ ...baseItem, date: t.due_date });
            } else {
                // Generate instances for the current view

                // If recurrence started before view, fast forward loosely (optimization)
                // For simplicity, we just iterate day by day or use math. 
                // Since views are small (1 month), we can just check relevant dates.

                // Better approach: Iterate days in view and check if match
                const daysInView = eachDayOfInterval({ start: viewStart, end: viewEnd });

                daysInView.forEach(day => {
                    // Must be after or on due date
                    if (isBefore(day, dueDate) && !isSameDay(day, dueDate)) return;

                    let isMatch = false;
                    if (t.recurrence === 'daily') isMatch = true;
                    else if (t.recurrence === 'weekly') isMatch = getDay(dueDate) === getDay(day);
                    else if (t.recurrence === 'monthly') isMatch = getDate(dueDate) === getDate(day);

                    if (isMatch) {
                        items.push({
                            ...baseItem,
                            id: `${t.id}_${format(day, 'yyyy-MM-dd')}`, // Unique ID for key
                            originalId: t.id,
                            date: format(day, 'yyyy-MM-dd')
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

        return [...items, ...gEvents];
    }, [todos, currentDate, googleEvents]);

    const acceptedFriends = collaborations.filter(c => c.status === 'accepted');

    const { enablePush, pushEnabled } = useNotifications();

    return (
        <div className="flex flex-col p-4 md:p-6 gap-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 flex-none">
                <div className="flex flex-col w-full gap-2 order-2 sm:order-1">
                    <div className="flex items-center gap-3 w-full justify-end sm:justify-start">
                        <Button
                            variant="outline"
                            onClick={connectGoogle}
                            className={cn(
                                "gap-2 font-medium transition-all h-11 px-6",
                                isGoogleConnected
                                    ? "bg-primary/10 text-primary border-primary/50 hover:bg-primary/20"
                                    : "hover:bg-muted"
                            )}
                        >
                            <img src={googleIcon} alt="G" className="h-4 w-4" />
                            {isGoogleConnected ? "Synced" : "Sync Calendar"}
                        </Button>
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={() => {
                                    resetForm();
                                    if (selectedDate) setDate(format(selectedDate, "yyyy-MM-dd"));
                                }} variant="default" className="h-11 px-6 shrink-0 flex items-center gap-2">
                                    <Plus className="h-4 w-4" />
                                    <span className="hidden sm:inline">Add Task</span>
                                    <span className="sm:hidden">Add</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>{editingId ? "Edit Task" : "Add Task"}</DialogTitle>
                                    <DialogDescription>
                                        Manage your planner and reminders.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label>Task Title</Label>
                                        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Buy Groceries" required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Description (Optional)</Label>
                                        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Details..." className="resize-none h-20" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <div className="flex items-center justify-between">
                                                <Label>Date <span className="text-xs text-muted-foreground font-normal">(Optional)</span></Label>
                                                {date && (
                                                    <button type="button" onClick={() => setDate("")} className="text-xs text-muted-foreground hover:text-red-500">
                                                        Clear
                                                    </button>
                                                )}
                                            </div>
                                            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Time (Optional)</Label>
                                            <Select value={time} onValueChange={setTime}>
                                                <SelectTrigger className="h-9">
                                                    <SelectValue placeholder="Select time" />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-[200px]">
                                                    <SelectItem value="none">None</SelectItem>
                                                    {timeOptions.map((option) => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg border">
                                        <div className="flex items-center gap-2">
                                            <RefreshCw className="h-4 w-4 text-muted-foreground" />
                                            <Label className="cursor-pointer">Recurrence</Label>
                                        </div>
                                        <Select value={recurrence} onValueChange={(val: any) => setRecurrence(val)}>
                                            <SelectTrigger className="w-[140px] h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                                <SelectItem value="daily">Daily</SelectItem>
                                                <SelectItem value="weekly">Weekly</SelectItem>
                                                <SelectItem value="monthly">Monthly</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg border">
                                        <div className="flex items-center gap-2">
                                            <div className={`h-4 w-4 rounded-full border-2 ${urgency === 'critical' ? 'border-red-500 bg-red-500/20' :
                                                urgency === 'high' ? 'border-orange-500 bg-orange-500/20' :
                                                    urgency === 'normal' ? 'border-primary bg-primary/20' :
                                                        'border-slate-500 bg-slate-500/20'
                                                }`} />
                                            <Label className="cursor-pointer">Urgency</Label>
                                        </div>
                                        <Select value={urgency} onValueChange={(val: any) => setUrgency(val)}>
                                            <SelectTrigger className="w-[140px] h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="low">Low</SelectItem>
                                                <SelectItem value="normal">Normal</SelectItem>
                                                <SelectItem value="high">High</SelectItem>
                                                <SelectItem value="critical">Critical</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Shared With Section */}
                                    {!editingId && (
                                        <div className="flex flex-col gap-3 bg-muted/30 p-3 rounded-lg border">
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                <Label>Share with Team</Label>
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
                                                                    "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all",
                                                                    isSelected ? "bg-primary/20 border-primary" : "bg-card border-border hover:bg-muted"
                                                                )}
                                                            >
                                                                <Avatar className="h-6 w-6">
                                                                    <AvatarImage src={friend.profile?.photoURL} />
                                                                    <AvatarFallback className="text-[10px]">{friend.profile?.displayName?.[0]}</AvatarFallback>
                                                                </Avatar>
                                                                <span className="text-xs font-medium">{friend.profile?.displayName}</span>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-muted-foreground">
                                                    No team members found. <br />
                                                    <a href="/collaboration" className="text-primary hover:underline">Invite friends</a> to start collaborating.
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-3 bg-muted/30 p-3 rounded-lg border">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Bell className="h-4 w-4 text-muted-foreground" />
                                                <Label htmlFor="notify" className="cursor-pointer">Notifications</Label>
                                            </div>
                                            <Switch id="notify" checked={notify} onCheckedChange={async (checked) => {
                                                setNotify(checked);
                                                if (checked && !pushEnabled) {
                                                    await enablePush();
                                                }
                                            }} />
                                        </div>

                                        {notify && (
                                            <div className="flex items-center justify-between pt-1 border-t border-border/50">
                                                <Label className="text-xs text-muted-foreground">Remind me</Label>
                                                <Select value={notifyBefore} onValueChange={(val: any) => setNotifyBefore(val)}>
                                                    <SelectTrigger className="w-[140px] h-8 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="10_min">10 Minutes Before</SelectItem>
                                                        <SelectItem value="1_hour">1 Hour Before</SelectItem>
                                                        <SelectItem value="1_day">1 Day Before</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </div>

                                    <DialogFooter>
                                        <Button type="submit">{editingId ? "Update Task" : "Save Task"}</Button>
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
                    </div>

                    {/* Mobile View Toggle */}
                    <div className="flex lg:hidden bg-muted/50 p-1 rounded-lg w-full">
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
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end order-1 sm:order-2">
                    <h2 className="text-xl font-bold mr-3 hidden sm:block min-w-[140px] text-right">
                        {format(currentDate, "MMMM yyyy")}
                    </h2>
                    <Button variant="outline" size="icon" onClick={handlePrev} className="h-9 w-9">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="secondary" size="sm" onClick={handleToday} className="h-9 font-medium px-4">
                        Today
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleNext} className="h-9 w-9">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
                <div className={cn(
                    "w-full lg:w-80 flex-none flex flex-col gap-4 border lg:border-l-0 border-border/50 bg-card rounded-xl lg:rounded-l-none lg:bg-background lg:border-l lg:border-t-0 lg:border-b-0 lg:border-r-0 lg:shadow-none shadow-sm p-4 min-h-0",
                    mobileView === 'calendar' ? "hidden lg:flex" : "flex"
                )}>
                    <div className="flex items-center justify-between shrink-0 mb-1 lg:mb-2 lg:pt-2">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5 text-primary" />
                            {format(selectedDate, "MMM do")}
                        </h3>
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
                            ) : todosOnSelectedDate.length > 0 ? (
                                <div className="space-y-3">
                                    {todosOnSelectedDate.map(todo => (
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
                                                            <p className={cn("text-sm font-medium leading-none truncate", todo.completed && "line-through text-muted-foreground")}>
                                                                {todo.title}
                                                            </p>
                                                            {todo.urgency && !todo.completed && (
                                                                <span className={cn(
                                                                    "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ml-2 shrink-0",
                                                                    todo.urgency === 'critical' ? "bg-red-500/15 text-red-600" :
                                                                        todo.urgency === 'high' ? "bg-orange-500/15 text-orange-600" :
                                                                            (todo.urgency === 'normal' || (todo.urgency as any) === 'medium') ? "bg-primary/15 text-primary" :
                                                                                "bg-slate-500/15 text-slate-600"
                                                                )}>
                                                                    {(todo.urgency as any) === 'medium' ? 'NORMAL' : todo.urgency}
                                                                </span>
                                                            )}

                                                        </div>
                                                        {todo.description && (
                                                            <p className="text-xs text-muted-foreground line-clamp-2">{todo.description}</p>
                                                        )}
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
                                                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => setSharingId(todo.id)}
                                                            className="p-1 hover:bg-blue-500/10 hover:text-blue-500 rounded text-xs text-muted-foreground transition-colors"
                                                        >
                                                            <Share2 className="h-3.5 w-3.5" />
                                                        </button>
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
                                                                setOpen(true);
                                                            }}
                                                            className="p-1 hover:bg-muted rounded text-xs"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => deleteToDo(todo.id)}
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
                            ) : (
                                <div className="flex flex-col items-center justify-center text-center p-4 text-muted-foreground border-2 border-dashed rounded-xl bg-muted/10">
                                    <CheckSquare className="h-8 w-8 mb-2 opacity-10" />
                                    <p className="text-xs font-medium">No scheduled tasks</p>
                                    <Button variant="link" size="sm" onClick={() => {
                                        resetForm();
                                        if (selectedDate) setDate(format(selectedDate, "yyyy-MM-dd"));
                                        setOpen(true);
                                    }} className="text-emerald-600/70 text-xs h-auto p-0 mt-1">Add for today</Button>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col pr-2 space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    {listFilter === 'anytime' ? 'Anytime' : listFilter === 'recurring' ? 'Recurring' : 'Overdue'}
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
                                ) : visibleSideList.map(todo => (
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
                                                        <p className={cn("text-sm font-medium leading-none truncate", todo.completed && "line-through text-muted-foreground")}>
                                                            {todo.title}
                                                        </p>
                                                        {todo.urgency && !todo.completed && (
                                                            <span className={cn(
                                                                "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ml-2 shrink-0",
                                                                todo.urgency === 'critical' ? "bg-red-500/15 text-red-600" :
                                                                    todo.urgency === 'high' ? "bg-orange-500/15 text-orange-600" :
                                                                        (todo.urgency === 'normal' || (todo.urgency as any) === 'medium') ? "bg-primary/15 text-primary" :
                                                                            "bg-slate-500/15 text-slate-600"
                                                            )}>
                                                                {(todo.urgency as any) === 'medium' ? 'NORMAL' : todo.urgency}
                                                            </span>
                                                        )}

                                                    </div>
                                                    {todo.description && (
                                                        <p className="text-xs text-muted-foreground line-clamp-2">{todo.description}</p>
                                                    )}
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
                                                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => setSharingId(todo.id)}
                                                        className="p-1 hover:bg-blue-500/10 hover:text-blue-500 rounded text-xs text-muted-foreground transition-colors"
                                                    >
                                                        <Share2 className="h-3.5 w-3.5" />
                                                    </button>
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
                                                            setOpen(true);
                                                        }}
                                                        className="p-1 hover:bg-muted rounded text-xs"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => deleteToDo(todo.id)}
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
                                    {listFilter === 'anytime' ? "No anytime tasks" : listFilter === 'recurring' ? "No recurring tasks" : "No overdue tasks"}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className={cn(
                    "flex-1 min-h-0 flex-col bg-card/20 rounded-xl overflow-hidden shadow-sm border border-border/50",
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
        </div>
    );
}
