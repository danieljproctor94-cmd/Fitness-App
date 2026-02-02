import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, Dumbbell, Flame, Plus, Weight } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useData } from "@/features/data/DataContext";
import { format, subMonths, isAfter, parseISO, startOfWeek } from "date-fns";

export default function Dashboard() {
    const { workouts, measurements, userProfile, isLoading } = useData();
    const [currentDate, setCurrentDate] = useState(new Date());

    // Chart Timeframe State
    const [timeframe, setTimeframe] = useState("ALL");

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

    // 2. Filter Chart Data based on Timeframe
    const getFilteredChartData = () => {
        const now = new Date();
        let startDate = new Date(0); // Beginning of time

        if (timeframe === "1M") startDate = subMonths(now, 1);
        else if (timeframe === "3M") startDate = subMonths(now, 3);
        else if (timeframe === "6M") startDate = subMonths(now, 6);

        return measurements
            .filter(m => isAfter(parseISO(m.date), startDate))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    };

    const weightChartData = getFilteredChartData();

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

    return (
        <div className="p-6 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Hey {userProfile.displayName?.split(' ')[0] || "User"}, welcome back!</h1>
                    <p className="text-muted-foreground">{format(currentDate, "EEEE, MMMM do, yyyy")}</p>
                </div>
                <div className="hidden md:flex gap-2">
                    <Button asChild className="h-11 px-6">
                        <Link to="/workouts" className="flex items-center gap-2">
                            <Plus className="h-4 w-4" /> Log Workout
                        </Link>
                    </Button>
                    <Button variant="outline" asChild className="h-11 px-6">
                        <Link to="/measurements" className="flex items-center gap-2">
                            <Weight className="h-4 w-4" /> Log Weight
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Core Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Weekly Goal</CardTitle>
                        <Dumbbell className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
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
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-7">
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

                {/* Weight Chart with Time Toggles */}
                <Card className="col-span-full md:col-span-4">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="space-y-1">
                            <CardTitle>Weight</CardTitle>
                            <CardDescription>
                                {timeframe === "ALL" ? "All time history" : `Last ${timeframe}`}
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                            {(["1M", "3M", "6M", "ALL"]).map(tf => (
                                <button
                                    key={tf}
                                    onClick={() => setTimeframe(tf)}
                                    className={`
                                        text-xs font-medium px-3 py-1 rounded-md transition-colors
                                        ${timeframe === tf ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}
                                    `}
                                >
                                    {tf}
                                </button>
                            ))}
                        </div>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[250px] w-full">
                            {isLoading ? (
                                <Skeleton className="h-full w-full" />
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={weightChartData}>
                                        <defs>
                                            <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis
                                            dataKey="date"
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(str) => {
                                                const d = new Date(str);
                                                return isNaN(d.getTime()) ? str : format(d, "MMM d");
                                            }}
                                        />
                                        <YAxis
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            domain={["dataMin - 1", "dataMax + 1"]}
                                            tickFormatter={(value) => `${value}kg`}
                                        />
                                        <Tooltip
                                            labelFormatter={(label) => {
                                                const d = new Date(label);
                                                return isNaN(d.getTime()) ? label : format(d, "MMMM d, yyyy");
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="weight"
                                            stroke="hsl(var(--primary))"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorWeight)"
                                            dot={{ r: 4, fill: "hsl(var(--background))", strokeWidth: 2 }}
                                            activeDot={{ r: 6 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div >
    );
}
