import { useState } from "react";
import { useData } from "@/features/data/DataContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, parseISO } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function MeasurementAnalytics() {
    const { measurements, isLoading } = useData();
    const navigate = useNavigate();
    const [timeRange, setTimeRange] = useState("all");

    // Filter and Sort Data
    const sortedMeasurements = [...measurements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const filteredData = sortedMeasurements.filter(m => {
        if (timeRange === "all") return true;
        const date = new Date(m.date);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (timeRange === "30d") return diffDays <= 30;
        if (timeRange === "90d") return diffDays <= 90;
        if (timeRange === "1y") return diffDays <= 365;
        return true;
    });

    const formatDate = (dateStr: string) => {
        try {
            return format(parseISO(dateStr), "MMM d");
        } catch (e) {
            return dateStr;
        }
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
                    <p className="font-medium mb-1">{formatDate(label)}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} style={{ color: entry.color }} className="text-sm">
                            {entry.name}: {entry.value} {entry.unit || ''}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    const hasData = (key: string) => filteredData.some(m => m[key as keyof typeof m] !== undefined && m[key as keyof typeof m] !== null);

    if (isLoading) {
        return <div className="p-8 text-center">Loading analytics...</div>;
    }

    return (
        <div className="p-4 md:p-8 space-y-6 pb-20 md:pb-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/measurements")}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Analytics</h1>
                        <p className="text-muted-foreground">Deep dive into your body composition trends.</p>
                    </div>
                </div>

                <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="30d">Last 30 Days</SelectItem>
                        <SelectItem value="90d">Last 3 Months</SelectItem>
                        <SelectItem value="1y">Last Year</SelectItem>
                        <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Charts Grid */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Weight Chart */}
                <Card className="col-span-1 md:col-span-2">
                    <CardHeader>
                        <CardTitle>Weight Progression</CardTitle>
                        <CardDescription>Body weight over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={filteredData}>
                                    <defs>
                                        <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={formatDate}
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        minTickGap={30}
                                    />
                                    <YAxis
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        domain={['auto', 'auto']}
                                        tickFormatter={(value) => `${value}kg`}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="weight"
                                        name="Weight"
                                        unit="kg"
                                        stroke="hsl(var(--primary))"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorWeight)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Waist */}
                {hasData('waist') && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Waist Circumference</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={filteredData.filter(d => d.waist)}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                        <XAxis dataKey="date" tickFormatter={formatDate} fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis domain={['auto', 'auto']} fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Line type="monotone" dataKey="waist" name="Waist" unit="cm" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Chest */}
                {hasData('chest') && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Chest Circumference</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={filteredData.filter(d => d.chest)}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                        <XAxis dataKey="date" tickFormatter={formatDate} fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis domain={['auto', 'auto']} fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Line type="monotone" dataKey="chest" name="Chest" unit="cm" stroke="#ec4899" strokeWidth={2} dot={{ r: 3 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Arms */}
                {hasData('arms') && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Arms Circumference</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={filteredData.filter(d => d.arms)}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                        <XAxis dataKey="date" tickFormatter={formatDate} fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis domain={['auto', 'auto']} fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Line type="monotone" dataKey="arms" name="Arms" unit="cm" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Neck */}
                {hasData('neck') && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Neck Circumference</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={filteredData.filter(d => d.neck)}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                        <XAxis dataKey="date" tickFormatter={formatDate} fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis domain={['auto', 'auto']} fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Line type="monotone" dataKey="neck" name="Neck" unit="cm" stroke="#eab308" strokeWidth={2} dot={{ r: 3 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {!hasData('waist') && !hasData('chest') && !hasData('arms') && !hasData('neck') && filteredData.length > 0 && (
                    <div className="col-span-1 md:col-span-2 text-center p-8 border rounded-xl border-dashed">
                        <p className="text-muted-foreground">Log more specific body measurements (Waist, Chest, Arms, Neck) to see detailed trends here.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
