import { useData } from "@/features/data/DataContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckSquare, TrendingUp, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from "recharts";
import { format, subDays, isSameDay, parseISO } from "date-fns";

export default function TaskAnalytics() {
    const { todos, todoCompletions, isLoading } = useData();
    const navigate = useNavigate();

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading analytics...</div>;
    }

    // --- KPI Calculations ---
    const totalTasks = todos.length;
    const completedTasks = todos.filter(t => t.completed).length; // Only counts non-recurring completions marked as 'done'
    const pendingTasks = todos.filter(t => !t.completed).length;

    // Calculate global completion rate (Simple view: Completed / Total)
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Recurring completions count (Total instances completed)
    const recurringCompletionsCount = todoCompletions.length;

    // High/Critical Urgency Tasks Pending
    const highPriorityPending = todos.filter(t =>
        !t.completed && (t.urgency === 'high' || t.urgency === 'critical')
    ).length;


    // --- Chart Data Preparation ---

    // 1. Urgency Distribution (Pie Chart)
    const urgencyData = [
        { name: 'Critical', value: todos.filter(t => t.urgency === 'critical' && !t.completed).length, color: '#ef4444' }, // Red-500
        { name: 'High', value: todos.filter(t => t.urgency === 'high' && !t.completed).length, color: '#f97316' },     // Orange-500
        { name: 'Normal', value: todos.filter(t => t.urgency === 'normal' && !t.completed).length, color: '#3b82f6' }, // Blue-500
        { name: 'Low', value: todos.filter(t => t.urgency === 'low' && !t.completed).length, color: '#22c55e' },      // Green-500
    ].filter(d => d.value > 0);

    // 2. Activity Trends (Last 30 Days)
    const last30Days = Array.from({ length: 30 }, (_, i) => {
        const d = subDays(new Date(), 29 - i);
        return {
            date: d,
            label: format(d, 'MMM d'),
            created: 0,
            completedRecurring: 0
        };
    });

    // Map "Tasks Created"
    todos.forEach(t => {
        if (t.created_at) {
            const date = parseISO(t.created_at);
            const dayStat = last30Days.find(d => isSameDay(d.date, date));
            if (dayStat) dayStat.created++;
        }
    });

    // Map "Recurring Tasks Completed"
    todoCompletions.forEach(tc => {
        // completed_date is typically YYYY-MM-DD
        const date = parseISO(tc.completed_date);
        const dayStat = last30Days.find(day => isSameDay(day.date, date));
        if (dayStat) dayStat.completedRecurring++;
    });

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20 md:pb-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/planner")}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Task Analytics</h1>
                        <p className="text-muted-foreground">Insights into your productivity and task trends.</p>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
                        <CheckSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingTasks}</div>
                        <p className="text-xs text-muted-foreground">total pending tasks</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Recurring Completions</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{recurringCompletionsCount}</div>
                        <p className="text-xs text-muted-foreground">total instances completed</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{completionRate}%</div>
                        <p className="text-xs text-muted-foreground">of non-recurring tasks</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Critical Pending</CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{highPriorityPending}</div>
                        <p className="text-xs text-muted-foreground">High or Critical urgency</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 md:grid-cols-2">

                {/* Activity Chart */}
                <Card className="col-span-1 md:col-span-2">
                    <CardHeader>
                        <CardTitle>Activity Trends (30 Days)</CardTitle>
                        <CardDescription>New tasks created vs. Recurring tasks completed</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={last30Days}>
                                    <defs>
                                        <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                    <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                        itemStyle={{ fontSize: '12px' }}
                                    />
                                    <Legend verticalAlign="top" height={36} />
                                    <Area type="monotone" dataKey="created" name="Tasks Created" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorCreated)" />
                                    <Area type="monotone" dataKey="completedRecurring" name="Recurring Completed" stroke="#22c55e" fillOpacity={1} fill="url(#colorCompleted)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Urgency Breakdown */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Pending Tasks by Urgency</CardTitle>
                        <CardDescription>Breakdown of active tasks</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            {urgencyData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={urgencyData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {urgencyData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground">
                                    No pending tasks with urgency set.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Summary / Motivation Card (Placeholder for AI insights) */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Insights (Beta)</CardTitle>
                        <CardDescription>AI-powered observations</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-muted/50 rounded-lg border">
                            <p className="text-sm italic">
                                "{completionRate > 50 ? "Great job keeping up with your tasks!" : "You have a few pending tasks piling up. Consider tackling the High urgency ones first."}"
                            </p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            <p>Most productive day: <span className="font-medium text-foreground">Coming soon</span></p>
                            <p>Average completion time: <span className="font-medium text-foreground">Coming soon</span></p>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
