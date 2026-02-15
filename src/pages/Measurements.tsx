import { ProgressGallery } from "@/components/measurements/ProgressGallery";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Calendar, Calculator, Save, TrendingUp } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useData } from "@/features/data/DataContext";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { AiMetricsOverview } from "@/components/AiMetricsOverview";
import { useNavigate } from "react-router-dom";

export default function Measurements() {
    const { measurements, addMeasurement, deleteMeasurement, userProfile, updateUserProfile, isLoading } = useData();
    const navigate = useNavigate();
    // Body Stats State
    const [localProfile, setLocalProfile] = useState(userProfile);
    // Add local weight state for the calculator form
    const sortedMeasurements = [...measurements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const currentWeight = sortedMeasurements.length > 0 ? sortedMeasurements[0].weight : "";
    const [calculatorWeight, setCalculatorWeight] = useState(currentWeight.toString());

    // History Sort State
    const [isNewestFirst, setIsNewestFirst] = useState(true);

    // Sync profile and weight when context changes
    useEffect(() => {
        setLocalProfile(userProfile);
        if (sortedMeasurements.length > 0) {
            setCalculatorWeight(sortedMeasurements[0].weight.toString());
        }
    }, [userProfile, measurements]);

    const handleProfileChange = (field: keyof typeof localProfile, value: string) => {
        setLocalProfile(prev => ({ ...prev, [field]: value }));
    };

    const saveStats = () => {
        // 1. Update Profile (Height, Waist, etc.)
        updateUserProfile(localProfile);

        // 2. Log Full Snapshot to History
        // parse values safely
        const newWeight = parseFloat(calculatorWeight);
        const waist = parseFloat(localProfile.waist) || undefined;
        const neck = parseFloat(localProfile.neck) || undefined;
        const chest = parseFloat(localProfile.chest) || undefined;
        const arms = parseFloat(localProfile.arms) || undefined;
        const height = parseFloat(localProfile.height) || undefined;

        if (!isNaN(newWeight)) {
            addMeasurement({
                date: new Date().toISOString().split('T')[0],
                weight: newWeight,
                waist,
                neck,
                chest,
                arms,
                height
            });
        }
    };

    // Dialog logic removed


    const sortedForChart = [...measurements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const sortedForHistory = [...measurements].sort((a, b) => {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        return isNewestFirst ? timeB - timeA : timeA - timeB;
    });

    // Calculate Header Stats
    const bmi = (localProfile.height && currentWeight)
        ? (parseFloat(currentWeight.toString()) / Math.pow(parseFloat(String(localProfile.height)) / 100, 2)).toFixed(1)
        : "N/A";

    const totalChange = (localProfile.starting_weight && currentWeight)
        ? (parseFloat(currentWeight.toString()) - parseFloat(String(localProfile.starting_weight))).toFixed(1)
        : null;

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">Measurements</h1>
                        <Button variant="outline" size="sm" onClick={() => navigate("/measurements/analytics")} className="hidden md:flex">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Analytics
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => navigate("/measurements/analytics")} className="md:hidden">
                            <TrendingUp className="h-5 w-5" />
                        </Button>
                    </div>
                    <p className="text-muted-foreground">Track your body metrics and composition.</p>
                </div>

                {/* Stats Summary - Replaces Log Weight Button */}
                {!isLoading && currentWeight && (
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 -mx-6 px-6 md:mx-0 md:px-0 hide-scrollbar scroll-smooth">
                        <div className="flex flex-col items-center justify-center bg-card border border-border/50 shadow-sm rounded-xl px-4 py-2 min-w-[100px] shrink-0">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Weight</span>
                            <span className="text-xl font-bold">{currentWeight} <span className="text-sm font-normal text-muted-foreground">kg</span></span>
                        </div>

                        {totalChange && (
                            <div className="flex flex-col items-center justify-center bg-card border border-border/50 shadow-sm rounded-xl px-4 py-2 min-w-[100px] shrink-0">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Change</span>
                                <span className={cn("text-xl font-bold", parseFloat(totalChange) <= 0 ? "text-green-500" : "text-amber-500")}>
                                    {parseFloat(totalChange) > 0 ? "+" : ""}{totalChange} <span className="text-sm font-normal">kg</span>
                                </span>
                            </div>
                        )}

                        <div className="flex flex-col items-center justify-center bg-card border border-border/50 shadow-sm rounded-xl px-4 py-2 min-w-[100px] shrink-0">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">BMI</span>
                            <span className="text-xl font-bold">{bmi}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Chart */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Weight</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px] w-full">
                            {isLoading ? (
                                <Skeleton className="h-full w-full" />
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={sortedForChart}>
                                        <defs>
                                            <linearGradient id="colorWeightMeasurements" x1="0" y1="0" x2="0" y2="1">
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
                                            domain={['dataMin - 1', 'dataMax + 1']}
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
                                            fill="url(#colorWeightMeasurements)"
                                            dot={{ r: 4, fill: "hsl(var(--background))", strokeWidth: 2 }}
                                            activeDot={{ r: 6 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Body Stats Calculator Form */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calculator className="h-5 w-5" />
                            Body Stats Calculator
                        </CardTitle>
                        <CardDescription>Update your stats to recalculate BMI & Body Fat.</CardDescription>
                    </CardHeader>
                    {isLoading ? (
                        <CardContent className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <div className="grid grid-cols-2 gap-4">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        </CardContent>
                    ) : (
                        <CardContent className="space-y-4">
                            <div className="flex gap-2 mb-2">
                                <Button
                                    variant={localProfile.gender === 'male' ? 'default' : 'outline'}
                                    onClick={() => handleProfileChange('gender', 'male')}
                                    size="sm"
                                    className="flex-1"
                                >
                                    Male
                                </Button>
                                <Button
                                    variant={localProfile.gender === 'female' ? 'default' : 'outline'}
                                    onClick={() => handleProfileChange('gender', 'female')}
                                    size="sm"
                                    className="flex-1"
                                >
                                    Female
                                </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground uppercase">Height (cm)</label>
                                    <Input type="number" placeholder="175" value={localProfile.height} onChange={(e) => handleProfileChange('height', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground uppercase">Age</label>
                                    <Input type="number" placeholder="0" value={localProfile.age || ''} onChange={(e) => handleProfileChange('age', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground uppercase">Starting Weight (kg)</label>
                                    <Input
                                        type="number"
                                        placeholder="e.g. 90"
                                        value={localProfile.starting_weight || ''}
                                        onChange={(e) => handleProfileChange('starting_weight', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground uppercase">Current Weight (kg)</label>
                                    <Input type="number" placeholder="75" value={calculatorWeight} onChange={(e) => setCalculatorWeight(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground uppercase">Waist (cm)</label>
                                    <Input type="number" placeholder="80" value={localProfile.waist} onChange={(e) => handleProfileChange('waist', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground uppercase">Neck (cm)</label>
                                    <Input type="number" placeholder="38" value={localProfile.neck} onChange={(e) => handleProfileChange('neck', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground uppercase">Chest (cm)</label>
                                    <Input type="number" placeholder="optional" value={localProfile.chest} onChange={(e) => handleProfileChange('chest', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground uppercase">Arms (cm)</label>
                                    <Input type="number" placeholder="optional" value={localProfile.arms} onChange={(e) => handleProfileChange('arms', e.target.value)} />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <label className="text-xs font-medium text-muted-foreground uppercase">Activity Level</label>
                                    <Select
                                        value={localProfile.activity_level || 'sedentary'}
                                        onValueChange={(val) => handleProfileChange('activity_level', val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select activity level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="sedentary">Sedentary (Office job, little exercise)</SelectItem>
                                            <SelectItem value="light">Lightly Active (1-3 days/week)</SelectItem>
                                            <SelectItem value="moderate">Moderately Active (3-5 days/week)</SelectItem>
                                            <SelectItem value="active">Active (6-7 days/week)</SelectItem>
                                            <SelectItem value="very_active">Very Active (Physical job + training)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <Button onClick={saveStats} className="w-full mt-4" variant="secondary">
                                <Save className="h-4 w-4 mr-2" />
                                Save & Recalculate
                            </Button>

                            {localProfile.starting_weight && calculatorWeight && (
                                <div className="mt-4 p-3 bg-muted/50 rounded-lg flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Total Progress:</span>
                                    <span className={cn(
                                        "font-bold",
                                        (parseFloat(calculatorWeight) - Number(localProfile.starting_weight)) <= 0 ? "text-green-500" : "text-amber-500"
                                    )}>
                                        {(parseFloat(calculatorWeight) - Number(localProfile.starting_weight)).toFixed(1)} kg
                                        {(parseFloat(calculatorWeight) - Number(localProfile.starting_weight)) <= 0 ? " Lost" : " Gained"}
                                    </span>
                                </div>
                            )}
                        </CardContent>
                    )}
                </Card>
            </div>

            {/* AI Overview Section */}
            <div className="mt-6">
                <AiMetricsOverview />
            </div>

            <ProgressGallery />
            <div className="h-6" />
            {/* History Log */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>History Log</CardTitle>
                        <CardDescription>Recent body composition entries</CardDescription>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsNewestFirst(!isNewestFirst)}
                        className="text-muted-foreground text-xs"
                    >
                        {isNewestFirst ? "Order: Newest First" : "Order: Oldest First"}
                    </Button>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                        </div>
                    ) : sortedForHistory.length > 0 ? (
                        <div className="space-y-4">
                            {sortedForHistory.map((item) => (
                                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between border-b last:border-0 pb-4 last:pb-0 gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="bg-muted p-2 rounded-full mt-1">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="font-medium">
                                                {format(parseISO(item.date), "MMMM do, yyyy")}
                                                {item.created_at && (
                                                    <span className="text-muted-foreground text-sm font-normal ml-2">
                                                        at {format(parseISO(item.created_at), "h:mm a")}
                                                    </span>
                                                )}
                                            </p>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                                <span className="text-sm font-semibold">{item.weight} kg</span>
                                                {item.waist && <span className="text-xs text-muted-foreground">Waist: {item.waist}cm</span>}
                                                {item.neck && <span className="text-xs text-muted-foreground">Neck: {item.neck}cm</span>}
                                                {item.chest && <span className="text-xs text-muted-foreground">Chest: {item.chest}cm</span>}
                                                {item.arms && <span className="text-xs text-muted-foreground">Arms: {item.arms}cm</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-destructive self-end sm:self-center"
                                        onClick={() => deleteMeasurement(item.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-6">
                            No history available. Log your body stats!
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
