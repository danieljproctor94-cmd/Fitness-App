import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Brain, TrendingUp, ShieldCheck, Info } from "lucide-react";
import { useData } from "@/features/data/DataContext";
import { generateAiOverview } from "@/lib/ai-health-generator";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";

export function AiMetricsOverview() {
    const { userProfile, measurements, isLoading } = useData();

    const aiData = useMemo(() => {
        if (!userProfile.height || measurements.length === 0) return null;

        // Sort measurements to get weight history
        const sortedMeasurements = [...measurements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        // Map to simple history format
        const weightHistory = sortedMeasurements.map(m => ({ date: m.date, weight: m.weight }));
        // Get current weight (last one)
        const currentWeight = sortedMeasurements[sortedMeasurements.length - 1].weight;

        return generateAiOverview({
            gender: userProfile.gender || 'male',
            age: parseInt(userProfile.age || "30"),
            heightCm: parseFloat(userProfile.height),
            weightKg: currentWeight,
            waistCm: userProfile.waist ? parseFloat(userProfile.waist) : undefined,
            neckCm: userProfile.neck ? parseFloat(userProfile.neck) : undefined,
            activityLevel: userProfile.activity_level,
            weightHistory: weightHistory
        });
    }, [userProfile, measurements]);

    if (isLoading) {
        return <Skeleton className="w-full h-64" />;
    }

    if (!aiData) {
        return (
            <Card className="border-border/50 bg-muted/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                        <Sparkles className="h-5 w-5" />
                        AI Health Overview
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Please update your height and log at least one weight measurement to generate your personalized AI health overview.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="relative overflow-hidden border-border/50 shadow-sm">
            {/* Gradient Strip - hidden on mobile if requested, or just kept contained */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-indigo-500 to-purple-500" />
            <CardHeader className="bg-muted/10 pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <CardTitle className="flex items-center gap-2 text-xl text-foreground">
                        <Sparkles className="h-5 w-5 text-primary" />
                        AI Metrics Overview
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 text-xs uppercase tracking-wider font-semibold text-primary/80 bg-primary/10 px-2 py-1 rounded-full">
                        <Info className="h-3 w-3" />
                        Informational Only
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">

                {/* Plain Summary & Connected Insights */}
                <div className="space-y-4">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <p className="text-lg font-medium leading-relaxed text-foreground">
                            {aiData.plainSummary}
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                            {aiData.connectedInsights}
                        </p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 pt-2">
                    {/* Age Context */}
                    <div className="space-y-2">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
                            <Brain className="h-4 w-4 text-purple-500" />
                            Age Context
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-lg border border-border/50">
                            {aiData.ageContext}
                        </p>
                    </div>

                    {/* Trajectory */}
                    <div className="space-y-2">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
                            <TrendingUp className="h-4 w-4 text-blue-500" />
                            Recent Trajectory
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-lg border border-border/50">
                            {aiData.trajectory}
                        </p>
                    </div>
                </div>

                {/* Leverage Points */}
                <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                    <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                        Leverage Points for You
                    </h4>
                    <ul className="space-y-2">
                        {aiData.leveragePoints.map((point, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                                {point}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Reassurance & Boundary */}
                <div className="pt-4 border-t flex flex-col md:flex-row gap-4 items-start md:items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-start gap-2 max-w-xl">
                        <ShieldCheck className="h-4 w-4 text-green-600/70 shrink-0 mt-0.5" />
                        <p>{aiData.reassurance}</p>
                    </div>
                    <p className="opacity-60 italic shrink-0">
                        *Not medical advice.
                    </p>
                </div>

            </CardContent>
        </Card>
    );
}
