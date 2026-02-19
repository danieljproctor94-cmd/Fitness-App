import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, CheckCircle2, Clock, Dumbbell, Flame, Weight, Plus, RefreshCw, CheckSquare as CheckSquareIcon, ArrowDown, ArrowUp, AlertTriangle, Circle, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useData } from "@/features/data/DataContext";
import { format, isAfter, parseISO, startOfWeek, isSameDay, isBefore, getDay, getDate, getMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import googleIcon from "@/assets/google.png";


export default function Dashboard() {
    const { workouts, measurements, userProfile, isLoading, todos, todoCompletions, todoExceptions, addToDo, updateToDo, toggleRecurringCompletion, goals } = useData();
    const safeGoals = Array.isArray(goals) ? goals : [];
    useGoogleCalendar();
    const [currentDate, setCurrentDate] = useState(new Date());

    // Quick Add State
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [time, setTime] = useState("none");
    const [recurrence, setRecurrence] = useState("none");
    const [urgency, setUrgency] = useState("normal");
    const [notify, setNotify] = useState(false);
    const [notifyBefore] = useState("10_min");

    const handleSaveTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) return;

        const newTodo = {
            title,
            description,
            completed: false,
            user_id: userProfile?.id,
            created_at: new Date().toISOString(),
            due_date: date,
            due_time: time === "none" ? undefined : time,
            recurrence: recurrence as any,
            urgency: urgency as any,
            notify,
            notify_before: notifyBefore as any,
        };

        await addToDo(newTodo);
        setIsAddOpen(false);
        toast.success("Task added!");
        
        // Reset
        setTitle("");
        setDescription("");
        setDate(format(new Date(), "yyyy-MM-dd"));
        setTime("none");
        setRecurrence("none");
        setUrgency("normal");
        setNotify(false);
    };

    useEffect(() => {
        const timer = setInterval(() => setCurrentDate(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // 1. Stats (Weekly)
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday start
    const weeklyWorkouts = workouts.filter(w => isAfter(parseISO(w.date), weekStart) || w.date === format(weekStart, "yyyy-MM-dd"));

    const workoutsCount = weeklyWorkouts.length;

    // Fix: Robust sort handling same-day entries by prioritizing latest added (index)
    // We map to preserve the original index (assuming newer items are appended to the end of the array),
    // then sort. This guarantees that for same-day entries, the one with the higher index (newest) comes first.
    const sortedMeasurementsDescending = measurements
        .map((m, i) => ({ ...m, _originalIndex: i }))
        .sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            if (dateB !== dateA) return dateB - dateA;

            // If dates equal, try created_at
            const createdA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const createdB = b.created_at ? new Date(b.created_at).getTime() : 0;
            if (createdB !== createdA) return createdB - createdA;

            // Fallback: Use original index (assuming newer items are appended to end)
            // We want NEWEST first, so Descending order of _originalIndex
            return b._originalIndex - a._originalIndex;
        });

    const currentWeight = sortedMeasurementsDescending.length > 0 ? sortedMeasurementsDescending[0].weight : 0;
    const activeMinutes = weeklyWorkouts.reduce((acc, curr) => acc + (parseInt(curr.duration) || 0), 0);


    // 3. Streak
    // 3. Streak (Weekly Based)
    const calculateWeeklyStreaks = () => {
        if (workouts.length === 0) return { current: 0, record: 0 };

        // Group workouts by Week
        const weeks: Record<string, number[]> = {};

        workouts.forEach(w => {
            const date = parseISO(w.date);
            const weekStr = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
            // Day index: 0=Mon, 6=Sun
            let dayIndex = date.getDay() - 1;
            if (dayIndex === -1) dayIndex = 6;

            if (!weeks[weekStr]) weeks[weekStr] = [];
            if (!weeks[weekStr].includes(dayIndex)) weeks[weekStr].push(dayIndex);
        });

        let maxRecord = 0;
        let currentWeekStreak = 0;

        Object.keys(weeks).forEach(weekStr => {
            const days = weeks[weekStr].sort((a, b) => a - b);
            let maxInThisWeek = 0;
            let currentRun = 0;
            let lastDay = -2;

            days.forEach(day => {
                if (day === lastDay + 1) {
                    currentRun++;
                } else {
                    currentRun = 1;
                }
                if (currentRun > maxInThisWeek) maxInThisWeek = currentRun;
                lastDay = day;
            });

            if (maxInThisWeek > maxRecord) maxRecord = maxInThisWeek;

            // Check if this is the CURRENT week
            const thisWeekStr = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
            if (weekStr === thisWeekStr) {
                const today = new Date();
                let todayDayIndex = today.getDay() - 1;
                if (todayDayIndex === -1) todayDayIndex = 6;

                // Calculate streak ending today or up to now for this week
                // Simple logic: Max consecutive days in current week so far?
                // Request says: "show the current consecutive days in a row" and "Dashboard streak should be reset every week".
                // I will show the max streak achieved THIS week as the "currentstreak" or the active streak?
                // "Reset every week" implies it starts at 0 on Monday. 
                // "Consecutive days in a row" - usually means active chain. 
                // Let's use the max consecutive run found in the current week so far.
                currentWeekStreak = maxInThisWeek;
            }
        });

        return { current: currentWeekStreak || 0, record: maxRecord || 0 };
    };

    const { current: currentStreak, record: streakRecord } = calculateWeeklyStreaks();

    // 4. BMI Logic (Linear Gauge)
    let bmiValue = 0;
    let bmiLabel = "N/A";
    let bmiColor = "text-muted-foreground";
    let bodyFatValue = null;

    if (userProfile.height && currentWeight > 0) {
        const h = parseFloat(userProfile.height) / 100;
        const w = currentWeight;
        bmiValue = parseFloat((w / (h * h)).toFixed(1));

        if (bmiValue < 18.5) { bmiLabel = "Underweight"; bmiColor = "text-blue-500"; }
        else if (bmiValue < 25) { bmiLabel = "Healthy Weight"; bmiColor = "text-green-500"; }
        else if (bmiValue < 30) { bmiLabel = "Overweight"; bmiColor = "text-orange-500"; }
        else { bmiLabel = "Obese"; bmiColor = "text-red-500"; }

        if (userProfile.waist && userProfile.neck && userProfile.height) {
            const wa = parseFloat(userProfile.waist);
            const n = parseFloat(userProfile.neck);
            const hCm = parseFloat(userProfile.height);

            if (wa > n) {
                const bf = 495 / (1.0324 - 0.19077 * Math.log10(wa - n) + 0.15456 * Math.log10(hCm)) - 450;
                bodyFatValue = parseFloat(bf.toFixed(1));
            }
        }
    }

    // 4b. Ideal Weight & AI Summary Logic
    let idealWeightRange = "N/A";
    let aiSummary = "Complete your profile to get AI insights.";
    let dailyCalories = 0;

    if (userProfile.height) {
        const h = parseFloat(userProfile.height) / 100;
        const hCm = parseFloat(userProfile.height);
        const w = currentWeight;
        const age = userProfile.age ? parseInt(userProfile.age) : 30; // Default to 30 if not set
        const gender = userProfile.gender || 'male';
        const activity = userProfile.activity_level || 'sedentary';

        const minW = (18.5 * h * h).toFixed(1);
        const maxW = (24.9 * h * h).toFixed(1);
        idealWeightRange = `${minW} - ${maxW} kg`;

        if (w > 0) {
            // BMR Calculation (Mifflin-St Jeor)
            let bmr = (10 * w) + (6.25 * hCm) - (5 * age);
            if (gender === 'male') bmr += 5;
            else bmr -= 161;

            // TDEE Multiplier
            const multipliers: Record<string, number> = {
                'sedentary': 1.2,
                'light': 1.375,
                'moderate': 1.55,
                'active': 1.725,
                'very_active': 1.9
            };
            const tdee = bmr * (multipliers[activity] || 1.2);

            // Calorie Goal Adjustment based on BMI
            if (bmiValue < 18.5) dailyCalories = Math.round(tdee + 300); // Surplus
            else if (bmiValue > 25) dailyCalories = Math.round(tdee - 500); // Deficit
            else dailyCalories = Math.round(tdee); // Maintenance

            // Generate "AI" Insight
            if (bmiValue < 18.5) aiSummary = `Your BMI is low. Recommendation: Consume ~${dailyCalories} kcal/day (surplus) to build mass safely. Focus on protein and strength training.`;
            else if (bmiValue < 25) aiSummary = `You are at a healthy weight! Maintenance calories are ~${dailyCalories} kcal/day. Keep up your ${activity} lifestyle.`;
            else if (bmiValue < 30) aiSummary = `To reach a healthy weight, aim for ~${dailyCalories} kcal/day (deficit). Consistent ${activity !== 'sedentary' ? 'activity' : 'movement'} and portion control are key.`;
            else aiSummary = `Your metrics suggest a target of ~${dailyCalories} kcal/day for gradual weight loss. Consider consulting a nutritionist for a personalized plan.`;
        } else {
            // Fallback if no weight
            if (bmiValue < 18.5) aiSummary = "Your BMI indicates you may be underweight. Focus on nutrient-rich calorie surplus and resistance training to build healthy mass.";
            else if (bmiValue < 25) aiSummary = "Great job! You are maintaining a healthy weight. Keep up your balanced routine of activity and nutrition.";
            else if (bmiValue < 30) aiSummary = "You are slightly above the ideal range. Increasing daily steps and slight caloric adjustments can help you reach your target.";
            else aiSummary = "Your metrics suggest prioritizing consistent, low-impact activity. Consult with a specialist to create a sustainable plan for your health goals.";
        }

        // Contextualize with trend
        if (sortedMeasurementsDescending.length > 1 && w > 0) {
            const diff = w - sortedMeasurementsDescending[1].weight;
            if (diff < 0 && bmiValue > 25) aiSummary += " You're doing great! weight is trending down.";
            if (diff > 0 && bmiValue < 18.5) aiSummary += " Nice progress! You're gaining weight as planned.";
        }
    }

    // 5. Weight Progress Logic
    let weightChangeLabel = "No change";
    let weightChangeColor = "text-muted-foreground";

    if (sortedMeasurementsDescending.length > 1) {
        // Compare with the SECOND most recent entry (previous log) to show current trend
        const previousWeight = sortedMeasurementsDescending[1].weight;
        const diff = currentWeight - previousWeight;

        // Fix sign logic: toFixed(1) handles negative sign automatically. We update explicit plus for positive.
        const sign = diff > 0 ? "+" : "";

        if (diff < 0) weightChangeColor = "text-green-500";
        else if (diff > 0) weightChangeColor = "text-red-500";

        weightChangeLabel = `${sign}${diff.toFixed(1)} kg`;
    }

    const handleToggleComplete = async (todo: any) => {
        // Optimistic update for UI responsiveness
        const isRecurring = todo.recurrence !== 'none';
        const dateStr = format(new Date(), 'yyyy-MM-dd');

        if (isRecurring) {
            await toggleRecurringCompletion(todo.id, dateStr, true);
        } else {
            await updateToDo(todo.id, { completed: true });
        }

        toast.success("Task completed!");
    };

    return (
        <div className="p-6 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    {isLoading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-9 w-64" />
                            <Skeleton className="h-5 w-48" />
                        </div>
                    ) : (
                        <>
                            <h1 className="text-3xl font-bold tracking-tight">Hi {userProfile.displayName?.split(' ')[0] || "User"}, welcome back!</h1>
                            <p className="text-muted-foreground block md:hidden">{format(currentDate, "EEEE, MMMM do, yyyy")}</p>
                        </>
                    )}
                </div>

            </div>



            {/* Core Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Weekly Goal</CardTitle>
                        <Dumbbell className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    {/* ... content ... */}
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <div className="relative h-16 w-16">
                                {/* Background Ring */}
                                <svg className="h-full w-full -rotate-90 transform">
                                    <circle
                                        cx="32"
                                        cy="32"
                                        r="28"
                                        stroke="currentColor"
                                        strokeWidth="6" // slightly thicker
                                        fill="transparent"
                                        className="text-muted/20"
                                    />
                                    {/* Progress Ring */}
                                    {!isLoading && (
                                        <circle
                                            cx="32"
                                            cy="32"
                                            r="28"
                                            stroke="currentColor"
                                            strokeWidth="6"
                                            fill="transparent"
                                            strokeDasharray={2 * Math.PI * 28}
                                            strokeDashoffset={2 * Math.PI * 28 * (1 - Math.min(workoutsCount / (userProfile.weekly_workout_goal || 4), 1))}
                                            strokeLinecap="round"
                                            className="text-primary transition-all duration-1000 ease-out"
                                        />
                                    )}
                                </svg>
                                {/* Center Icon */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Dumbbell className="h-5 w-5 text-primary" />
                                </div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">
                                    {isLoading ? <Skeleton className="h-8 w-16 mb-1" /> : <>{workoutsCount}<span className="text-muted-foreground text-lg">/{userProfile.weekly_workout_goal || 4}</span></>}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">workouts completed</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                        <Flame className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-8 w-24" /> : (
                            <div>
                                <div className="text-2xl font-bold">{currentStreak} Day{currentStreak !== 1 && "s"}</div>
                                <p className="text-xs text-muted-foreground mt-1">Record: {streakRecord} Days</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Current Weight</CardTitle>
                        <Weight className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-2">
                                <Skeleton className="h-8 w-24" />
                                <Skeleton className="h-4 w-16" />
                            </div>
                        ) : (
                            <>
                                <div className="flex items-baseline justify-between">
                                    <div className="text-2xl font-bold">{currentWeight > 0 ? `${currentWeight} kg` : "--"}</div>
                                    {currentWeight > 0 && sortedMeasurementsDescending.length > 1 && (
                                        <div className={`text-sm font-medium ${weightChangeColor}`}>
                                            {weightChangeLabel}
                                        </div>
                                    )}
                                </div>
                                {currentWeight > 0 && sortedMeasurementsDescending.length > 1 && (
                                    <p className="text-xs text-muted-foreground mt-1">Since last log</p>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Weekly Active Mins</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">{activeMinutes}</div>}
                        <p className="text-xs text-muted-foreground mt-1">This week</p>
                    </CardContent>
                </Card>
            </div><div className="grid grid-cols-1 gap-6 md:grid-cols-7">
                {/* Health Overview (Linear Gauge) */}
                <Card className="col-span-full md:col-span-3">
                    <CardHeader>
                        <CardTitle>Health Overview</CardTitle>
                        <CardDescription>Based on your latest measurements.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {isLoading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-8 w-24" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-32 w-full" />
                            </div>
                        ) : bmiValue > 0 ? (
                            <>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">BMI Score</span>
                                        <span className={`text-xl font-bold ${bmiColor}`}>{bmiValue}</span>
                                    </div>
                                    <div className="relative h-2 w-full rounded-full bg-secondary overflow-hidden">
                                        <div className="absolute top-0 bottom-0 left-0 bg-blue-400 w-[18.5%]" title="Underweight" />
                                        <div className="absolute top-0 bottom-0 left-[18.5%] bg-green-500 w-[6.5%]" title="Healthy" />
                                        <div className="absolute top-0 bottom-0 left-[25%] bg-orange-400 w-[5%]" title="Overweight" />
                                        <div className="absolute top-0 bottom-0 left-[30%] bg-red-500 w-[70%]" title="Obese" />
                                        <div
                                            className="absolute top-0 bottom-0 w-1 bg-black border border-white z-10 transition-all font-bold"
                                            style={{ left: `${Math.min(bmiValue, 40)}%` }}
                                        />
                                    </div>
                                    <div className={`text-center text-sm font-medium ${bmiColor} pt-1`}>
                                        {bmiLabel}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                                    <div className="text-center">
                                        <div className="text-muted-foreground text-xs uppercase tracking-wider">Body Fat</div>
                                        <div className="text-lg font-bold">{bodyFatValue ? `${bodyFatValue}%` : "N/A"}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-muted-foreground text-xs uppercase tracking-wider">Target Weight</div>
                                        <div className="text-lg font-bold">{idealWeightRange}</div>
                                    </div>
                                    <div className="text-center col-span-2 border-t pt-2 mt-2">
                                        <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Recommended Intake</div>
                                        <div className="text-2xl font-bold text-primary">{dailyCalories > 0 ? `${dailyCalories} kcal` : "--"}</div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-indigo-500">
                                        <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                                        AI Health Summary
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {aiSummary}
                                    </p>
                                </div>
                            </>

                        ) : (
                            <div className="text-center py-6 space-y-3">
                                <p className="text-muted-foreground">Complete your body stats to see your analysis.</p>
                                <Button variant="outline" className="h-11 px-6" asChild>
                                    <Link to="/measurements" className="flex items-center gap-2">
                                        Go to Measurements <Weight className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Tasks for Today */}
                <Card className="col-span-full md:col-span-4 h-full flex flex-col">
                                        <CardHeader className="flex flex-row items-center justify-between pb-6 shrink-0">
                        <CardTitle>Tasks for Today</CardTitle>
                        <div className="flex items-center gap-2">
                            <Button size="sm" className="h-8 text-xs gap-1" onClick={() => setIsAddOpen(true)}>
                                <Plus className="h-3.5 w-3.5" /> Quick Add
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 overflow-y-auto px-6 scrollbar-thin min-h-[250px] max-h-[350px]">
                        {isLoading ? (
                            <div className="space-y-3">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                            </div>
                        ) : (() => {
                            // Filter tasks for today
                            const today = new Date();
                            

                            const todaysTasks = todos.filter(t => {
                                if (t.completed) return false;
                                if (!t.due_date) return false;
                                const dueDate = parseISO(t.due_date);

                                // Check Recurrence
                                if (t.recurrence === 'none') {
                                    return isSameDay(dueDate, today);
                                }

                                // Recurring Logic
                                if (isBefore(today, dueDate) && !isSameDay(today, dueDate)) return false;

                                let isMatch = false;
                                if (t.recurrence === 'daily') isMatch = true;
                                else if (t.recurrence === 'weekly') isMatch = getDay(dueDate) === getDay(today);
                                else if (t.recurrence === 'monthly') isMatch = getDate(dueDate) === getDate(today);
                                else if (t.recurrence === 'yearly') isMatch = getDate(dueDate) === getDate(today) && getMonth(dueDate) === getMonth(today);

                                if (isMatch) {
                                    const dateStr = format(today, 'yyyy-MM-dd');
                                    const isExcluded = todoExceptions.some(ex => ex.todo_id === t.id && ex.exception_date === dateStr);
                                    if (isExcluded) return false;
                                    const isCompletedForDate = todoCompletions.some(tc => tc.todo_id === t.id && tc.completed_date === dateStr);
                                    if (isCompletedForDate) return false;
                                    return true;
                                }
                                return false;
                            });

                             const combined = todaysTasks.map(t => ({ ...t, isGoogleEvent: !!t.google_event_id })).sort((a, b) => {
                                if (a.due_time && b.due_time) return a.due_time.localeCompare(b.due_time);
                                if (a.due_time) return -1;
                                if (b.due_time) return 1;
                                return 0;
                            });

                            if (combined.length === 0) {
                                return (
                                    <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground space-y-3 py-8">
                                        <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">All caught up!</p>
                                            <p className="text-xs">No pending tasks for today.</p>
                                        </div>
                                        <Button variant="outline" size="sm" asChild>
                                            <Link to="/planner">Plan Ahead</Link>
                                        </Button>
                                    </div>
                                );
                            }

                            return (
                                <div className="space-y-2">
                                    {combined.map((todo: any) => (
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
                                                    {todo.isGoogleEvent ? (
                                                        <div className="mt-1 h-5 w-5 flex items-center justify-center shrink-0">
                                                            <img src={googleIcon} alt="G" className="h-4 w-4 opacity-80" />
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleToggleComplete(todo)}
                                                            className={cn(
                                                                "mt-1 h-5 w-5 rounded border flex items-center justify-center shrink-0 transition-colors",
                                                                todo.completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-muted-foreground/30 hover:border-emerald-500"
                                                            )}
                                                        >
                                                            {todo.completed && <CheckSquareIcon className="h-3.5 w-3.5" />}
                                                        </button>
                                                    )}
                                                    <div className="flex-1 min-w-0 space-y-1">
                                                        <div className="flex items-center justify-between">
                                                            <p className={cn("text-sm font-medium leading-none truncate", todo.completed && "line-through text-muted-foreground", todo.isGoogleEvent && "text-blue-400")}>
                                                                {todo.title}
                                                            </p>

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
                                                            {todo.isGoogleEvent && (
                                                                <span className="flex items-center gap-1 bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded">
                                                                     G-Cal
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            );
                        })()}
                        </CardContent>
                </Card>
            </div>

            
            {/* Goals Summary (Bottom) */}
            <div className="pt-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                       <div className="space-y-1">
                           <CardTitle>Current Year Goals</CardTitle>
                           <CardDescription>Your Focus</CardDescription>
                       </div>
                       <Button variant="outline" size="sm" asChild>
                           <Link to="/goals" className="flex items-center gap-1">View Board <Target className="h-4 w-4" /></Link>
                       </Button>
                    </CardHeader>
                    <CardContent>
                         {safeGoals.length === 0 ? (
                             <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/5">
                                <Target className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                <p>No goals set yet.</p>
                                <Button variant="link" asChild><Link to="/goals">Set a Goal</Link></Button>
                             </div>
                         ) : (
                             <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                 {safeGoals.slice(0, 4).map(goal => (
                                     <div key={goal.id} className="flex flex-col space-y-3 p-4 border rounded-xl bg-card hover:border-primary/50 transition-colors">
                                         <div className="flex items-start justify-between">
                                             <span className="font-semibold truncate pr-2">{goal.title}</span>
                                             <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 uppercase tracking-wide", 
                                                goal.category === "Money" ? "bg-emerald-500/10 text-emerald-500" :
                                                goal.category === "Fitness" ? "bg-orange-500/10 text-orange-500" :
                                                "bg-primary/10 text-primary"
                                             )}>{goal.category}</span>
                                         </div>
                                         <div className="space-y-1.5">
                                             <div className="flex justify-between text-xs text-muted-foreground">
                                                 <span>Progress</span>
                                                 <span>{goal.progress}%</span>
                                             </div>
                                             <Progress value={goal.progress} className="h-1.5" />
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         )}
                    </CardContent>
                </Card>
            </div>

<Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Quick Add Task</DialogTitle>
                        <DialogDescription>
                            Add a new task to your schedule.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveTask}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Task Title</Label>
                                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Morning Workout" autoFocus required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-1.5">
                                    <Label className="text-xs text-muted-foreground">Date</Label>
                                    <Input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="h-10 text-base md:text-sm w-full"
                                        style={{ colorScheme: "dark" }}
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-xs text-muted-foreground">Time</Label>
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
                                    <Select value={urgency} onValueChange={(val) => setUrgency(val)}>
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
                                    <Select value={recurrence} onValueChange={(val) => setRecurrence(val)}>
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
                        </div>
                        <DialogFooter>
                            <Button type="submit">Save Task</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div >
    );
}










