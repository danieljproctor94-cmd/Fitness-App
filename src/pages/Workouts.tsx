import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BigCalendar } from "@/components/ui/big-calendar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Dumbbell, Plus, Trash2, X, Calendar as CalendarIcon, ChevronLeft, ChevronRight, MapPin, Activity, Clock, Pen } from "lucide-react";
import { useData, Workout, Exercise, Set } from "@/features/data/DataContext";
import { format, isSameDay, parseISO, addMonths, subMonths } from "date-fns";

import confetti from "canvas-confetti";

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
    const { workouts, addWorkout, deleteWorkout } = useData();
    const calendarView = "month";

    // Navigation State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [open, setOpen] = useState(false);

    // Form State
    const [name, setName] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [time, setTime] = useState("12:00");
    const [duration, setDuration] = useState("");
    const [exercises, setExercises] = useState<FormExercise[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);

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
    const totalWorkouts = workouts.length;

    return (
        <div className="flex flex-col h-full p-4 md:p-6 gap-4 overflow-hidden">

            {/* Top Navigation Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 flex-none">

                {/* Left: Navigation Controls */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button variant="outline" size="icon" onClick={handlePrev} className="h-9 w-9">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="secondary" size="sm" onClick={handleToday} className="h-9 font-medium px-4">
                        Today
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleNext} className="h-9 w-9">
                        <ChevronRight className="h-4 w-4" />
                    </Button>

                    <h2 className="text-xl font-bold ml-3 hidden sm:block min-w-[140px]">
                        {format(currentDate, "MMMM yyyy")}
                    </h2>
                </div>

                {/* Right: View Toggles & Actions */}
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">

                    {/* View Switcher REMOVED */}
                    {/* <div className="bg-muted p-1 rounded-lg flex items-center shrink-0">
                        <button
                            onClick={() => setCalendarView("month")}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${calendarView === "month" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            Month
                        </button>
                        <button
                            onClick={() => setCalendarView("week")}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${calendarView === "week" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            Week
                        </button>
                    </div> */}

                    <div className="h-6 w-px bg-border mx-1 hidden lg:block" />

                    {/* Stats */}
                    <div className="hidden xl:flex items-center gap-2 mr-2">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card text-xs font-medium text-muted-foreground whitespace-nowrap">
                            <Activity className="h-3.5 w-3.5" />
                            <span>{totalWorkouts} Workouts</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card text-xs font-medium text-muted-foreground whitespace-nowrap">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>Europe/Warsaw</span>
                        </div>
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
                            }} className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                <span className="hidden sm:inline">Add Workout</span>
                                <span className="sm:hidden">Add</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{editingId ? "Edit Workout" : "Log Workout"}</DialogTitle>
                                <DialogDescription>
                                    {editingId ? "Modify details, exercises, sets, and reps." : "Add details, exercises, sets, and reps."}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Workout Name</label>
                                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Leg Day" required />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Date</label>
                                        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Time</label>
                                        <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Duration (min)</label>
                                        <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} required />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-medium">Exercises</h3>
                                        <Button type="button" variant="outline" size="sm" onClick={addExercise}>+ Add Exercise</Button>
                                    </div>
                                    {exercises.map((ex, exIndex) => (
                                        <div key={ex.id} className="border rounded-md p-3 space-y-3 bg-muted/40">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-muted-foreground">#{exIndex + 1}</span>
                                                <Input placeholder="Exercise Name" value={ex.name} onChange={(e) => updateExerciseName(ex.id, e.target.value)} className="h-8" required />
                                                <Button type="button" variant="ghost" size="icon" onClick={() => removeExercise(ex.id)}><X className="h-4 w-4" /></Button>
                                            </div>
                                            <div className="pl-6 space-y-2">
                                                {ex.sets.map((set, sIndex) => (
                                                    <div key={set.id} className="flex items-center gap-2">
                                                        <span className="text-xs w-8 text-muted-foreground">S{sIndex + 1}</span>
                                                        <Input placeholder="kg" type="number" className="h-7 w-20" value={set.weight} onChange={(e) => updateSet(ex.id, set.id, "weight", e.target.value)} required />
                                                        <Input placeholder="reps" type="number" className="h-7 w-20" value={set.reps} onChange={(e) => updateSet(ex.id, set.id, "reps", e.target.value)} required />
                                                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeSet(ex.id, set.id)}><X className="h-3 w-3" /></Button>
                                                    </div>
                                                ))}
                                                <Button type="button" variant="link" size="sm" className="h-6 px-0 text-xs" onClick={() => addSet(ex.id)}>+ Add Set</Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <DialogFooter><Button type="submit">Save Workout</Button></DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Main Content Area - Fixed Layout */}
            <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 overflow-hidden">

                {/* Calendar Component - Takes available space */}
                <div className="flex-1 min-h-0 flex flex-col bg-card/20 rounded-xl overflow-hidden shadow-sm border border-border/50">
                    <BigCalendar
                        workouts={workouts}
                        selectedDate={selectedDate}
                        onSelectDate={setSelectedDate}
                        currentDate={currentDate}
                        view={calendarView}
                    />
                </div>

                {/* Side Panel - Fixed width on Desktop */}
                <div className="w-full lg:w-80 flex-none flex flex-col gap-4 border lg:border-l-0 border-border/50 bg-card rounded-xl lg:rounded-l-none lg:bg-background lg:border-l lg:border-t-0 lg:border-b-0 lg:border-r-0 lg:shadow-none shadow-sm p-4 lg:p-0 lg:pl-4 h-[30vh] lg:h-full min-h-0">
                    <div className="flex items-center justify-between shrink-0 mb-1 lg:mb-2 lg:pt-2">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5 text-primary" />
                            {format(selectedDate, "MMM do")}
                        </h3>
                        <span className="text-xs font-mono bg-muted px-2 py-1 rounded text-muted-foreground">{workoutsOnSelectedDate.length} sessions</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                        {workoutsOnSelectedDate.length > 0 ? (
                            workoutsOnSelectedDate.sort((a, b) => (a.time || "").localeCompare(b.time || "")).map(workout => (
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
                                            sets: ex.sets.map((s: Set) => ({
                                                id: s.id,
                                                weight: s.weight.toString(),
                                                reps: s.reps.toString()
                                            }))
                                        })));
                                        setEditingId(w.id);
                                        setOpen(true);
                                    }}
                                />
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-4 text-muted-foreground border-2 border-dashed rounded-xl bg-muted/10">
                                <Dumbbell className="h-10 w-10 mb-3 opacity-10" />
                                <p className="text-sm font-medium">No workouts yet</p>
                                <Button variant="link" size="sm" onClick={() => setOpen(true)} className="text-primary/70">Log your first one</Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
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
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
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
