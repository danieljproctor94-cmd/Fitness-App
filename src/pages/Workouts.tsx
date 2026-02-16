import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BigCalendar } from "@/components/ui/big-calendar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Dumbbell, Plus, Trash2, X, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Activity, Clock, Pen, BarChart3 } from "lucide-react";
import { useData, Workout, Exercise, Set as WorkoutSet } from "@/features/data/DataContext";
import { format, isSameDay, parseISO, addMonths, subMonths, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";

import confetti from "canvas-confetti";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface FormSet {
    id: string;
    weight: string;
    reps: string;
}
interface FormExercise {
    id: string;
    name: string;
    sets: FormSet[];
}

export default function Workouts() {
    const { workouts, addWorkout, deleteWorkout, isLoading } = useData();
    const calendarView = "month";

    // Navigation State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [open, setOpen] = useState(false);

    // Form State
    const [name, setName] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [time, setTime] = useState(format(new Date(), "HH:mm"));
    const [duration, setDuration] = useState("");
    const [exercises, setExercises] = useState<FormExercise[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Mobile & Pagination State
    const [mobileView, setMobileView] = useState<'list' | 'calendar'>('list');
        const [visibleCount, setVisibleCount] = useState(20);

    // Timer State
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [timerStartTime, setTimerStartTime] = useState<Date | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    // Timer Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isTimerRunning) {
            interval = setInterval(() => {
                setElapsedSeconds(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning]);

    const formatElapsedTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleStartWorkout = () => {
        setIsTimerRunning(true);
        setTimerStartTime(new Date());
        setElapsedSeconds(0);
    };

    const handleCompleteWorkout = () => {
        setIsTimerRunning(false);
        const durationMin = Math.ceil(elapsedSeconds / 60);
        setEditingId(null);
        setExercises([]);
        setName("New Workout");
        setDuration(durationMin.toString());
        if (selectedDate) setDate(format(selectedDate, "yyyy-MM-dd"));
        else setDate(new Date().toISOString().split("T")[0]);
        if (timerStartTime) setTime(format(timerStartTime, "HH:mm"));
        else setTime(format(new Date(), "HH:mm"));
        setOpen(true);
        setTimerStartTime(null);
        setElapsedSeconds(0);
    };

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

    const addSet = (exerciseId: string) => {
        setExercises(prev => prev.map(ex => {
            if (ex.id === exerciseId) {
                return {
                    ...ex,
                    sets: [...ex.sets, { id: crypto.randomUUID(), weight: "", reps: "" }]
                };
            }
            return ex;
        }));
    };

    const addExercise = () => {
        setExercises(prev => [
            ...prev,
            { id: crypto.randomUUID(), name: "", sets: [{ id: crypto.randomUUID(), weight: "", reps: "" }] }
        ]);
    };

    const removeExercise = (id: string) => {
        setExercises(prev => prev.filter(ex => ex.id !== id));
    };

    const updateExerciseName = (id: string, val: string) => {
        setExercises(prev => prev.map(ex => ex.id === id ? { ...ex, name: val } : ex));
    };

    const updateSet = (exerciseId: string, setId: string, field: keyof FormSet, val: string) => {
        setExercises(prev => prev.map(ex => {
            if (ex.id === exerciseId) {
                return {
                    ...ex,
                    sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: val } : s)
                };
            }
            return ex;
        }));
    };

    const removeSet = (exerciseId: string, setId: string) => {
        setExercises(prev => prev.map(ex => {
            if (ex.id === exerciseId) {
                return { ...ex, sets: ex.sets.filter(s => s.id !== setId) };
            }
            return ex;
        }));
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const workoutData = {
            name,
            date,
            time,
            duration,
            exercises: exercises.map(ex => ({
                id: ex.id,
                name: ex.name,
                sets: ex.sets.map(s => ({
                    id: s.id,
                    weight: parseFloat(s.weight) || 0,
                    reps: parseInt(s.reps) || 0
                }))
            }))
        };

        if (editingId) {
            // Edit Mode: Delete old and add new (Simulate Update)
            await deleteWorkout(editingId);
            await addWorkout(workoutData);
        } else {
            await addWorkout(workoutData);
            // Trigger Confetti
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }

        setOpen(false);
        setEditingId(null);
        setName("");
        setDuration("");
        setExercises([]);
    };

    const workoutsOnSelectedDate = workouts.filter(w => isSameDay(parseISO(w.date), selectedDate));

    // Weekly Progress Calculation
    const today = new Date();
    const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }); // Monday start
    const endOfCurrentWeek = endOfWeek(today, { weekStartsOn: 1 });

    const weeklyWorkouts = workouts.filter(w =>
        isWithinInterval(parseISO(w.date), { start: startOfCurrentWeek, end: endOfCurrentWeek })
    ).length;

    // Derived list of unique exercises history
    const uniqueExerciseNames = Array.from(new Set(
        workouts.flatMap(w => w.exercises.map(e => e.name?.trim())).filter(Boolean)
    )).sort();

    return (
        <div className="flex flex-col p-4 md:p-6 gap-4">

            {/* Top Navigation Bar */}
            <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">

                {/* Left: View Toggles & Actions (Swapped from Right) */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full xl:w-auto">

                    {/* Analytics Pills */}
                    <div className="flex items-center gap-2 mr-2">
                        <Link to="/workouts/analytics">
                            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground hover:text-white transition-colors">
                                <BarChart3 className="h-4 w-4" />
                                <span className="text-xs font-medium">Analytics</span>
                            </Button>
                        </Link>
                        <div className="h-4 w-px bg-border mx-1" />
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card text-xs font-medium text-muted-foreground whitespace-nowrap">
                            <Activity className="h-3.5 w-3.5" />
                            {isLoading ? (
                                <Skeleton className="h-3 w-32" />
                            ) : (
                                <span>{weeklyWorkouts} Workouts This Week</span>
                            )}
                        </div>

                    </div>

                                        <div className="h-8 w-px bg-border/60 hidden xl:block" />

                    {/* Timer & Main Actions */}
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        {isTimerRunning ? (
                            <div className="flex items-center gap-2 w-full sm:w-auto animate-in fade-in zoom-in duration-300">
                                <div className="h-10 px-2 sm:px-4 bg-primary/10 border border-primary/20 rounded-md flex items-center justify-center min-w-[80px] sm:min-w-[100px] shrink-0">
                                    <span className="text-base sm:text-lg font-mono font-bold text-primary tracking-wider">
                                        {formatElapsedTime(elapsedSeconds)}
                                    </span>
                                </div>
                                <Button 
                                    onClick={handleCompleteWorkout} 
                                    variant="destructive"
                                    className="h-10 px-3 sm:px-6 shadow-lg shadow-red-500/20 shrink flex-1 sm:flex-initial flex items-center justify-center gap-2 min-w-0 font-medium transition-all"
                                >
                                    <Check className="h-4 w-4 shrink-0" />
                                    <span className="hidden sm:inline whitespace-nowrap">Finish Workout</span>
                                    <span className="sm:hidden whitespace-nowrap">Finish</span>
                                </Button>
                            </div>
                        ) : (
                            <Button 
                                onClick={handleStartWorkout} 
                                className="h-10 px-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 shrink-0 flex items-center justify-center gap-2 w-full sm:w-auto font-medium transition-all"
                            >
                                <Activity className="h-4 w-4" />
                                <span className="hidden sm:inline">Start Workout</span>
                                <span className="sm:hidden">Start</span>
                            </Button>
                        )}
                        
                    </div>

                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => {
                                setEditingId(null);
                                setExercises([]);
                                setName("");
                                setDuration("");
                                if (selectedDate) setDate(format(selectedDate, "yyyy-MM-dd"));
                                else setDate(new Date().toISOString().split("T")[0]);
                                setTime(format(new Date(), "HH:mm"));
                            }} variant="outline" className="h-10 px-4 shrink-0 flex items-center justify-center gap-2 font-medium transition-all w-full sm:w-auto">
                                <Plus className="h-4 w-4" />
                                <span>Log Manually</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{editingId ? "Edit Workout" : "Log Workout"}</DialogTitle>
                                <DialogDescription>
                                    {editingId ? "Modify details, exercises, sets, and reps." : "Add details, exercises, sets, and reps."}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="grid gap-5 py-4">
                                <div className="grid gap-2">
                                    <Label>Workout Name</Label>
                                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Leg Day" required />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="grid gap-1.5">
                                        <Label className="text-xs text-muted-foreground">Date</Label>
                                        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9 text-base md:text-xs w-full appearance-none" style={{ colorScheme: "dark" }} required />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label className="text-xs text-muted-foreground">Time</Label>
                                        <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-9 text-base md:text-xs w-full appearance-none" style={{ colorScheme: "dark" }} required />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label className="text-xs text-muted-foreground">Duration (min)</Label>
                                        <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="h-9 text-base md:text-xs w-full appearance-none" required />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="font-medium">Exercises</Label>
                                        <Button type="button" variant="outline" size="sm" onClick={addExercise} className="h-8 text-xs">+ Add Exercise</Button>
                                    </div>
                                    <div className="space-y-0 divide-y border rounded-xl overflow-hidden">
                                        {exercises.map((ex, exIndex) => (
                                            <div key={ex.id} className="p-3 bg-card hover:bg-muted/20 transition-colors">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="text-xs font-mono text-muted-foreground w-4">#{exIndex + 1}</span>
                                                    <div className="flex-1">
                                                        <ExerciseAutocomplete
                                                            value={ex.name}
                                                            onChange={(val) => updateExerciseName(ex.id, val)}
                                                            existingExercises={uniqueExerciseNames}
                                                        />
                                                    </div>
                                                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-500" onClick={() => removeExercise(ex.id)}>
                                                        <X className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                                <div className="pl-7 space-y-2">
                                                    {ex.sets.map((set, sIndex) => (
                                                        <div key={set.id} className="flex items-center gap-2">
                                                            <span className="text-[10px] text-muted-foreground w-4">S{sIndex + 1}</span>
                                                            <div className="flex items-center gap-1">
                                                                <Input placeholder="0" type="number" className="h-7 w-16 text-center text-xs" value={set.weight} onChange={(e) => updateSet(ex.id, set.id, "weight", e.target.value)} required />
                                                                <span className="text-xs text-muted-foreground">kg</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Input placeholder="0" type="number" className="h-7 w-16 text-center text-xs" value={set.reps} onChange={(e) => updateSet(ex.id, set.id, "reps", e.target.value)} required />
                                                                <span className="text-xs text-muted-foreground">reps</span>
                                                            </div>
                                                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={() => removeSet(ex.id, set.id)}>
                                                                <X className="h-3 w-3 text-muted-foreground/50 hover:text-red-500" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                    <Button type="button" variant="link" size="sm" className="h-auto p-0 text-[10px] text-primary" onClick={() => addSet(ex.id)}>
                                                        + Add Set
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                        {exercises.length === 0 && (
                                            <div className="p-8 text-center text-muted-foreground text-sm">
                                                No exercises added yet. Use the button above.
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <DialogFooter><Button type="submit">Save Workout</Button></DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Right: Navigation Controls (Swapped from Left) */}
                <div className="flex items-center gap-2 w-full xl:w-auto justify-between xl:justify-end">


                    <div className={cn(
                        "flex items-center gap-2 w-full xl:w-auto justify-between xl:justify-end",
                        mobileView === 'list' ? "hidden lg:flex" : "flex"
                    )}>
                        <div className="flex items-center gap-2 w-full justify-between lg:justify-end">
                            <Button variant="outline" size="icon" onClick={handlePrev} className="h-10 w-10 border-border/60">
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="secondary" size="sm" onClick={handleToday} className="h-10 font-medium px-5 border border-border/50 bg-card hover:bg-muted">
                                Today
                            </Button>
                            <Button variant="outline" size="icon" onClick={handleNext} className="h-10 w-10 border-border/60">
                                <ChevronRight className="h-4 w-4" />
                            </Button>

                            <h2 className="text-xl font-bold ml-4 hidden sm:block min-w-[160px] text-right tracking-tight">
                                {format(currentDate, "MMMM yyyy")}
                            </h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile View Toggle */}
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

            {/* Main Content Area - Fixed Layout */}
            <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">

                {/* Side Panel - Swapped to Left */}
                <div className={cn(
                    "w-full lg:w-80 flex-none flex flex-col gap-4 border lg:border-r border-border/50 bg-card rounded-xl lg:rounded-r-none lg:bg-background lg:border-t-0 lg:border-b-0 lg:border-l-0 lg:shadow-none shadow-sm p-4 min-h-0",
                    mobileView === 'calendar' ? "hidden lg:flex" : "flex"
                )}>
                    <div className="flex items-center justify-between shrink-0 mb-1 lg:mb-2 lg:pt-2">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5 text-primary" />
                            {isSameDay(selectedDate, new Date()) ? `Today, ${format(selectedDate, "MMM do")}` : format(selectedDate, "MMM do")}
                        </h3>
                        <span className="text-xs font-mono bg-muted px-2 py-1 rounded text-muted-foreground">{workoutsOnSelectedDate.length} sessions</span>
                    </div>

                    <div className="flex-1 space-y-3 pr-2">
                        {isLoading ? (
                            <div className="space-y-3">
                                <Skeleton className="h-24 w-full" />
                                <Skeleton className="h-24 w-full" />
                                <Skeleton className="h-24 w-full" />
                            </div>
                        ) : workoutsOnSelectedDate.length > 0 ? (
                            <>
                                {workoutsOnSelectedDate
                                    .sort((a, b) => (a.time || "").localeCompare(b.time || ""))
                                    .slice(0, visibleCount)
                                    .map(workout => (
                                        <WorkoutCard
                                            key={workout.id}
                                            workout={workout}
                                            onDelete={deleteWorkout}
                                            onEdit={(w: Workout) => {
                                                // Populate form for editing
                                                setName(w.name);
                                                setDate(w.date);
                                                setTime(w.time || "12:00");
                                                setDuration(w.duration);
                                                setExercises(w.exercises.map((ex: Exercise) => ({
                                                    id: ex.id,
                                                    name: ex.name,
                                                    sets: ex.sets.map((s: WorkoutSet) => ({
                                                        id: s.id,
                                                        weight: s.weight.toString(),
                                                        reps: s.reps.toString()
                                                    }))
                                                })));
                                                setEditingId(w.id);
                                                setOpen(true);
                                            }}
                                        />
                                    ))}
                                {workoutsOnSelectedDate.length > visibleCount && (
                                    <Button
                                        variant="ghost"
                                        className="w-full mt-2 text-xs text-muted-foreground hover:text-primary"
                                        onClick={() => setVisibleCount(prev => prev + 20)}
                                    >
                                        Load More ({workoutsOnSelectedDate.length - visibleCount} remaining)
                                    </Button>
                                )}
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-4 text-muted-foreground border-2 border-dashed rounded-xl bg-muted/10">
                                <Dumbbell className="h-10 w-10 mb-3 opacity-10" />
                                <p className="text-sm font-medium">No workouts yet</p>
                                <Button variant="link" size="sm" onClick={() => setOpen(true)} className="text-primary/70">Log your first one</Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Calendar Component - Swapped to Right */}
                <div className={cn(
                    "flex-1 min-h-0 flex flex-col bg-card/20 rounded-xl overflow-hidden shadow-sm border border-border/50",
                    mobileView === 'list' ? "hidden lg:flex" : "flex"
                )}>
                    <BigCalendar
                        workouts={workouts}
                        selectedDate={selectedDate}
                        onSelectDate={(date) => {
                            setSelectedDate(date);
                            if (window.innerWidth < 1024) {
                                setMobileView('list');
                            }
                        }}
                        currentDate={currentDate}
                        view={calendarView}
                    />
                </div>
            </div>
        </div >
    );
}

interface WorkoutCardProps {
    workout: Workout;
    onDelete: (id: string) => Promise<void>;
    onEdit: (workout: Workout) => void;
}

function WorkoutCard({ workout, onDelete, onEdit }: WorkoutCardProps) {
    return (
        <Card className="shadow-none border border-border/60 bg-card/40 hover:bg-card hover:border-primary/30 transition-all group">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 p-3 pb-2">
                <div className="space-y-1">
                    {workout.time && (
                        <div className="flex items-center gap-1 text-[10px] text-primary/80 font-mono tracking-tight bg-primary/10 w-fit px-1.5 py-0.5 rounded-sm">
                            <Clock className="h-3 w-3" />
                            {workout.time}
                        </div>
                    )}
                    <CardTitle className="text-sm font-bold truncate max-w-[150px] leading-tight">
                        {workout.name}
                    </CardTitle>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => onEdit(workout)} className="text-muted-foreground hover:text-primary transition-colors" title="Edit Workout">
                        <Pen className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => onDelete(workout.id)} className="text-muted-foreground hover:text-red-500 transition-colors" title="Delete Workout">
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            </CardHeader>
            <CardContent className="p-3 pt-0">
                <div className="text-xs text-muted-foreground flex items-center gap-2 mb-2 mt-1">
                    <span>{workout.duration} min</span>
                    <span className="text-border">•</span>
                    <span>{workout.exercises.length} Exercises</span>
                </div>
            </CardContent>
        </Card>
    )
}
const ExerciseAutocomplete = ({ value, onChange, existingExercises }: { value: string, onChange: (val: string) => void, existingExercises: string[] }) => {
    const [open, setOpen] = useState(false);
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="h-8 w-full justify-between"
                >
                    {value || "Select exercise..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-white" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search exercise..." value={value} onValueChange={onChange} />
                    <CommandList>
                        <CommandEmpty>No exercise found. Type to add new.</CommandEmpty>
                        <CommandGroup>
                            {existingExercises.map((exercise) => (
                                <CommandItem
                                    key={exercise}
                                    value={exercise}
                                    onSelect={(currentValue: string) => {
                                        onChange(currentValue === value ? "" : currentValue);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === exercise ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {exercise}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};





