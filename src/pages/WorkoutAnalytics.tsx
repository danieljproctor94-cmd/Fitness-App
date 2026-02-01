import { useMemo } from "react";
import { useData } from "@/features/data/DataContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Dumbbell, Timer, TrendingUp, Calendar, Trophy, Zap } from "lucide-react";
import { format, eachDayOfInterval, subDays } from "date-fns";

export default function WorkoutAnalytics() {
    const { workouts } = useData();

    // --- Data Processing for Charts & Stats ---

    const stats = useMemo(() => {
        if (!workouts.length) return null;

        const totalWorkouts = workouts.length;
        const totalDuration = workouts.reduce((acc, w) => acc + (parseInt(w.duration) || 0), 0);

        let totalVolume = 0;
        let totalSets = 0;
        let totalReps = 0;

        workouts.forEach(w => {
            w.exercises.forEach(e => {
                e.sets.forEach(s => {
                    totalVolume += (s.weight || 0) * (s.reps || 0);
                    totalSets += 1;
                    totalReps += (s.reps || 0);
                });
            });
        });

        const avgDuration = Math.round(totalDuration / totalWorkouts);
        const avgVolume = Math.round(totalVolume / totalWorkouts);

        // Best Workout (by Volume)
        const bestWorkout = [...workouts].sort((a, b) => {
            const volA = a.exercises.reduce((acc, e) => acc + e.sets.reduce((sAcc, s) => sAcc + (s.weight * s.reps), 0), 0);
            const volB = b.exercises.reduce((acc, e) => acc + e.sets.reduce((sAcc, s) => sAcc + (s.weight * s.reps), 0), 0);
            return volB - volA;
        })[0];

        return {
            totalWorkouts,
            totalDuration,
            totalVolume,
            avgDuration,
            avgVolume,
            totalSets,
            totalReps,
            bestWorkout
        };
    }, [workouts]);

    const activityData = useMemo(() => {
        // Last 30 Days Activity
        const end = new Date();
        const start = subDays(end, 30);
        const days = eachDayOfInterval({ start, end });

        return days.map(day => {
            const dateStr = format(day, "yyyy-MM-dd");
            const count = workouts.filter(w => w.date === dateStr).length;
            return {
                date: format(day, "MMM dd"),
                count: count
            };
        });
    }, [workouts]);

    const volumeData = useMemo(() => {
        // Sort workouts by date ascending
        const sorted = [...workouts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        // Take last 20 workouts for cleaner chart
        const recent = sorted.slice(-20);

        return recent.map(w => {
            const vol = w.exercises.reduce((acc, e) => acc + e.sets.reduce((sAcc, s) => sAcc + (s.weight * s.reps), 0), 0);
            return {
                date: format(new Date(w.date), "MMM dd"), // Short date
                name: w.name, // Access 'name' from the workout object
                volume: vol
            };
        });
    }, [workouts]);

    const exerciseFrequency = useMemo(() => {
        const freq: Record<string, number> = {};
        workouts.forEach(w => {
            w.exercises.forEach(e => {
                if (!e.name) return;
                const name = e.name.trim();
                freq[name] = (freq[name] || 0) + 1;
            });
        });

        // Top 5
        return Object.entries(freq)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));
    }, [workouts]);


    if (!workouts.length) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="bg-primary/10 p-4 rounded-full">
                    <Dumbbell className="h-12 w-12 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">No Data Yet</h2>
                <p className="text-muted-foreground max-w-md">
                    Start logging your workouts to see analytics, trends, and insights here.
                </p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 pb-20 md:pb-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
                <p className="text-muted-foreground">Insights and trends from your training history.</p>
            </div>

            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Workouts</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalWorkouts}</div>
                        <p className="text-xs text-muted-foreground">Lifetime sessions</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
                        <Dumbbell className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{(stats?.totalVolume || 0).toLocaleString()} kg</div>
                        <p className="text-xs text-muted-foreground">Total weight moved</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Time Trained</CardTitle>
                        <Timer className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{Math.round((stats?.totalDuration || 0) / 60)} hrs</div>
                        <p className="text-xs text-muted-foreground">{stats?.totalDuration} minutes total</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Heaviest Session</CardTitle>
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.bestWorkout ? stats.bestWorkout.name : "-"}</div>
                        <p className="text-xs text-muted-foreground">Highest volume workout</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">

                {/* Volume Progression Chart */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Volume Progression</CardTitle>
                        <CardDescription>
                            Total volume (weight * reps) per workout for your last 20 sessions.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={volumeData}>
                                    <defs>
                                        <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="date"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                                        itemStyle={{ color: "hsl(var(--foreground))" }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="volume"
                                        stroke="#8884d8"
                                        fillOpacity={1}
                                        fill="url(#colorVolume)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Top Exercises Chart */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Favorite Exercises</CardTitle>
                        <CardDescription>
                            Most frequently performed movements.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {exerciseFrequency.map((item, index) => (
                                <div key={item.name} className="flex items-center">
                                    <div className="w-full space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">{index + 1}. {item.name}</span>
                                            <span className="text-sm text-muted-foreground">{item.count} sessions</span>
                                        </div>
                                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all"
                                                style={{ width: `${(item.count / (exerciseFrequency[0]?.count || 1)) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {/* Recent Activity Mini-Chart */}
                <Card className="col-span-1 md:col-span-3 lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Activity (30 Days)</CardTitle>
                        <CardDescription>
                            Workout frequency recently.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={activityData}>
                                    <XAxis
                                        dataKey="date"
                                        stroke="#888888"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        interval={6}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                                    />
                                    <Bar dataKey="count" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Stats Grid */}
                <Card className="col-span-2 md:col-span-3 lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Fun Facts</CardTitle>
                        <CardDescription>
                            Interesting tidbits about your journey.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Total Reps</span>
                                <div className="flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-yellow-500" />
                                    <span className="text-2xl font-bold">{stats?.totalReps.toLocaleString()}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Reps performed across all exercises.</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Total Sets</span>
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                    <span className="text-2xl font-bold">{stats?.totalSets.toLocaleString()}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Sets completed in total.</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Avg Intensity</span>
                                <div className="flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-red-500" />
                                    <span className="text-2xl font-bold">{Math.round((stats?.avgVolume || 0))} kg</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Average volume per workout.</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Avg Duration</span>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-blue-500" />
                                    <span className="text-2xl font-bold">{stats?.avgDuration} min</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Average time spent per session.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

import { Activity, Clock } from "lucide-react";
