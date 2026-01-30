import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BigCalendar } from "@/components/ui/big-calendar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Bell, RefreshCw, CheckSquare as CheckSquareIcon, CheckSquare } from "lucide-react";
import { useData, ToDo } from "@/features/data/DataContext";
import { format, isSameDay, parseISO, addMonths, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import confetti from "canvas-confetti";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";

const timeOptions = Array.from({ length: 24 }).map((_, i) => {
    const hour = i;
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    const value = `${hour.toString().padStart(2, '0')}:00`;
    const label = `${displayHour}:00 ${ampm}`;
    return { value, label };
});

export default function ToDos() {
    const { todos, addToDo, updateToDo, deleteToDo } = useData();
    const calendarView = "month";

    // Navigation State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [open, setOpen] = useState(false);

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
            due_date: date,
            due_time: time || undefined,
            recurrence,
            urgency,
            notify,
            notify_before: notify ? notifyBefore : undefined,
            completed: false
        };

        if (editingId) {
            await updateToDo(editingId, todoData);
        } else {
            // @ts-ignore - mismatch ID, handled by Supabase
            await addToDo(todoData);
        }

        setOpen(false);
        resetForm();
    };

    const resetForm = () => {
        setEditingId(null);
        setTitle("");
        setDescription("");
        setTime("");
        setTime("");
        setRecurrence('none');
        setUrgency('normal');
        setNotify(false);
        setNotifyBefore('10_min');
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

            // Handle Recurrence Logic (Basic)
            // If completing a recurring task, ideally we spawn the next one.
            // keeping it simple for now as requested: just mark complete.
        }
    };

    const todosOnSelectedDate = todos.filter(t => isSameDay(parseISO(t.due_date), selectedDate));
    // Sort: Time (if exists) -> CreatedAt
    todosOnSelectedDate.sort((a, b) => {
        if (a.due_time && b.due_time) return a.due_time.localeCompare(b.due_time);
        if (a.due_time) return -1;
        if (b.due_time) return 1;
        return 0;
    });

    // Adapt todos for BigCalendar (using 'workouts' prop for now, assuming BigCalendar can handle objects with date)
    // We might need to adjust BigCalendar or pass a mapped object if it strictly expects Workout type.
    // Looking at BigCalendar implementation might be needed. 
    // Assuming we can pass generic objects if BigCalendar logic is `items.filter(i => isSameDay(i.date...))`
    // If strict type, we might need a separate prop on BigCalendar or cast.
    // Let's coerce for now for the calendar view.
    const calendarItems = [
        ...todos.map(t => ({
            ...t,
            date: t.due_date,
            name: t.title,
            type: 'task'
        })),
        ...googleEvents.map(e => ({
            id: e.id,
            name: e.summary, // Map summary to name
            date: e.start.date || e.start.dateTime?.split('T')[0] || "",
            time: e.start.dateTime ? format(parseISO(e.start.dateTime), 'HH:mm') : undefined,
            type: 'google_event',
            // Mock other fields to satisfy BigCalendar types if needed, or handle in render
            title: e.summary,
            exercises: []
        }))
    ];

    return (
        <div className="flex flex-col h-full p-4 md:p-6 gap-4 overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 flex-none">
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
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
                        <img src="/src/assets/google-logo.png" alt="G" className="h-4 w-4" />
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
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>{editingId ? "Edit Task" : "Add Task"}</DialogTitle>
                                <DialogDescription>
                                    Manage your to-dos and reminders.
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
                                        <Label>Date</Label>
                                        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
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

                                <div className="flex flex-col gap-3 bg-muted/30 p-3 rounded-lg border">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Bell className="h-4 w-4 text-muted-foreground" />
                                            <Label htmlFor="notify" className="cursor-pointer">Notifications</Label>
                                        </div>
                                        <Switch id="notify" checked={notify} onCheckedChange={setNotify} />
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
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
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

            <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 overflow-hidden">
                {/* Side Panel - Fixed width on Desktop */}
                <div className="w-full lg:w-80 flex-none flex flex-col gap-4 border lg:border-l-0 border-border/50 bg-card rounded-xl lg:rounded-l-none lg:bg-background lg:border-l lg:border-t-0 lg:border-b-0 lg:border-r-0 lg:shadow-none shadow-sm p-4 h-[30vh] lg:h-full min-h-0">
                    <div className="flex items-center justify-between shrink-0 mb-1 lg:mb-2 lg:pt-2">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5 text-primary" />
                            {format(selectedDate, "MMM do")}
                        </h3>
                        <span className="text-xs font-mono bg-muted px-2 py-1 rounded text-muted-foreground">{todosOnSelectedDate.length} tasks</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                        {todosOnSelectedDate.length > 0 ? (
                            todosOnSelectedDate.map(todo => (
                                <Card key={todo.id} className={cn(
                                    "shadow-none border transition-all group relative overflow-hidden",
                                    todo.completed ? "bg-muted/20 border-border/50 opacity-60" : "bg-card/40 border-border/60 hover:bg-card hover:border-emerald-500/30",
                                    // Left border for urgency
                                    !todo.completed && todo.urgency === 'critical' ? 'border-l-4 border-l-red-500' :
                                        !todo.completed && todo.urgency === 'high' ? 'border-l-4 border-l-orange-500' :
                                            // Handle 'medium' for backward compatibility, map 'normal' to primary
                                            !todo.completed && (todo.urgency === 'normal' || todo.urgency === 'medium') ? 'border-l-4 border-l-primary' :
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
                                                                    (todo.urgency === 'normal' || todo.urgency === 'medium') ? "bg-primary/15 text-primary" :
                                                                        "bg-slate-500/15 text-slate-600"
                                                        )}>
                                                            {todo.urgency === 'medium' ? 'NORMAL' : todo.urgency}
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
                                                                // Convert 24h to 12h for display
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
                                                    onClick={() => {
                                                        setEditingId(todo.id);
                                                        setTitle(todo.title);
                                                        setDescription(todo.description || "");
                                                        setDate(todo.due_date);
                                                        // Ensure time format matches options (HH:00) or close enough
                                                        // For now just set raw value, Select might need exact match.
                                                        // Our options are HH:00. DB might save HH:mm:ss.
                                                        // If DB saves 13:00:00, we need to match 13:00.
                                                        const rawTime = todo.due_time || "";
                                                        setTime(rawTime.slice(0, 5));
                                                        setRecurrence(todo.recurrence);
                                                        // Map medium->normal for editing
                                                        setUrgency((todo.urgency === 'medium' ? 'normal' : todo.urgency) || 'normal');
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
                                                    className="p-1 hover:bg-red-500/10 hover:text-red-500 rounded text-xs text-muted-foreground"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-4 text-muted-foreground border-2 border-dashed rounded-xl bg-muted/10">
                                <CheckSquare className="h-10 w-10 mb-3 opacity-10" />
                                <p className="text-sm font-medium">No tasks for today</p>
                                <Button variant="link" size="sm" onClick={() => {
                                    resetForm();
                                    if (selectedDate) setDate(format(selectedDate, "yyyy-MM-dd"));
                                    setOpen(true);
                                }} className="text-emerald-600/70">Add a task</Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Calendar (Right) */}
                <div className="flex-1 min-h-0 flex flex-col bg-card/20 rounded-xl overflow-hidden shadow-sm border border-border/50">
                    {/* @ts-ignore - BigCalendar expects Workouts primarily but might assume shape overlap. 
                        Ideally we refactor BigCalendar to be generic or accept 'items' prop. 
                        Passing forced type for visual consistency now. */}
                    <BigCalendar
                        workouts={calendarItems as any}
                        selectedDate={selectedDate}
                        onSelectDate={setSelectedDate}
                        currentDate={currentDate}
                        view={calendarView}
                    />
                </div>
            </div>
        </div>
    );
}
