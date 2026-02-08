
import { useState, useEffect, useMemo } from "react";
import { format, isSameDay, parseISO, subDays } from "date-fns";
import { useData } from "@/features/data/DataContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Brain, Sparkles, Calendar, Heart, ArrowUpCircle, CheckCircle, Flame, Bell, Clock } from "lucide-react";
import { toast } from "sonner";
import { MindsetLog } from "@/features/data/DataContext";

// Simple "Mock AI" to generate a summary based on keywords
// In a real app, this would call an OpenAI API endpoint
const generateAISummary = (grateful: string, improve: string) => {
    const gratefulKeywords = ["family", "work", "health", "partner", "children", "food", "gym"];
    const foundGrateful = gratefulKeywords.filter(k => grateful.toLowerCase().includes(k));

    let summary = "It's wonderful that you're taking time to reflect. ";

    if (foundGrateful.length > 0) {
        summary += `Focusing on ${foundGrateful.join(", ")} gives you a strong foundation. `;
    } else {
        summary += "Finding joy in the small things builds resilience. ";
    }

    summary += " regarding your improvements: ";

    if (improve.toLowerCase().includes("exercise") || improve.toLowerCase().includes("gym") || improve.toLowerCase().includes("workout")) {
        summary += "Consistent movement is key. Try small steps first. ";
    } else if (improve.toLowerCase().includes("stress") || improve.toLowerCase().includes("anxiety")) {
        summary += "Remember to breathe. You've got this. ";
    } else if (improve.toLowerCase().includes("sleep")) {
        summary += "Recovery is just as important as work. Prioritize rest. ";
    } else {
        summary += "Self-awareness is the first step to growth. Keep pushing forward! ";
    }

    return summary;
};

const calculateStreak = (logs: MindsetLog[]) => {
    if (!logs || logs.length === 0) return 0;

    const uniqueDates = new Set(logs.map(log => log.date));
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const yesterday = subDays(today, 1);
    const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

    // If neither today nor yesterday has a log, streak is 0
    if (!uniqueDates.has(todayStr) && !uniqueDates.has(yesterdayStr)) {
        return 0;
    }

    // Start checking from today if logged, otherwise yesterday
    let currentCheck = uniqueDates.has(todayStr) ? today : yesterday;
    let streak = 0;

    while (uniqueDates.has(format(currentCheck, 'yyyy-MM-dd'))) {
        streak++;
        currentCheck = subDays(currentCheck, 1);
    }
    return streak;
};

export default function Mindset() {
    const { mindsetLogs, addMindsetLog, isLoading, userProfile, updateUserProfile } = useData();
    const [todayLog, setTodayLog] = useState<any | null>(null);
    const [gratefulFor, setGratefulFor] = useState("");
    const [improvements, setImprovements] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [aiSummary, setAiSummary] = useState<string | null>(null);

    const streak = useMemo(() => calculateStreak(mindsetLogs), [mindsetLogs]);

    // Check if logged today
    useEffect(() => {
        const today = new Date();
        const existingLog = mindsetLogs.find(log => isSameDay(parseISO(log.date), today));
        if (existingLog) {
            setTodayLog(existingLog);
            // Regenerate summary for display if strictly needed, or store it.
            // For now we re-generate on fly for the view state
            setAiSummary(generateAISummary(existingLog.grateful_for, existingLog.improvements));
        }
    }, [mindsetLogs]);

    const handleReminderToggle = async (checked: boolean) => {
        if (checked) {
            // Request permission
            if ("Notification" in window) {
                const permission = await Notification.requestPermission();
                if (permission !== "granted") {
                    toast.error("Notification permission denied. We cannot send you reminders.");
                    return; // Don't enable if denied
                }
            }
        }
        await updateUserProfile({ mindset_reminder_enabled: checked });
        toast.success(checked ? "Reminders enabled" : "Reminders disabled");
    };

    const handleTimeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = e.target.value;
        await updateUserProfile({ mindset_reminder_time: newTime });
        // Implicitly success, no toast needed for every keystroke if it was debounced, but for simple change on blur/enter it's fine. 
        // HTML time input fires change on commit usually.
        toast.success("Reminder time updated");
    };


    const handleSubmit = async () => {
        if (!gratefulFor.trim() || !improvements.trim()) {
            toast.error("Please fill out both fields.");
            return;
        }

        setIsSubmitting(true);

        // Simulate "AI Thinking"
        setTimeout(async () => {
            const dateStr = format(new Date(), "yyyy-MM-dd");
            const summary = generateAISummary(gratefulFor, improvements);

            await addMindsetLog({
                date: dateStr,
                grateful_for: gratefulFor,
                improvements: improvements
            });

            setAiSummary(summary);
            setIsSubmitting(false);

            // Reset form
            setGratefulFor("");
            setImprovements("");
            toast.success("Mindset logged! Streak updated.");
        }, 1500);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Brain className="h-8 w-8 text-primary" />
                        Mindset
                    </h1>
                    <p className="text-muted-foreground">Track your gratitude and growth. Train your mind like you train your body.</p>
                </div>
                {streak > 0 && (
                    <div className="flex items-center gap-2 bg-orange-500/10 text-orange-600 px-4 py-2 rounded-full border border-orange-500/20 animate-in fade-in slide-in-from-top-2">
                        <Flame className="h-5 w-5 fill-orange-500 text-orange-600" />
                        <span className="font-bold text-lg">{streak}</span>
                        <span className="text-xs font-medium uppercase tracking-wider opacity-80">Day Streak</span>
                    </div>
                )}
            </div>

            {/* Reminder Settings Card */}
            <Card className="bg-muted/50 border-dashed">
                <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-2 rounded-full">
                            <Bell className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold flex items-center gap-2">
                                Daily Journal Reminder
                                {userProfile?.mindset_reminder_enabled && (
                                    <span className="text-[10px] bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full border border-green-500/20 font-medium uppercase tracking-wide">
                                        Active
                                    </span>
                                )}
                            </h3>
                            <p className="text-sm text-muted-foreground">Get a notification to reflect on your day.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        {userProfile?.mindset_reminder_enabled && (
                            <div className="flex items-center gap-2 bg-background border px-3 py-1.5 rounded-md shadow-sm">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <input
                                    type="time"
                                    className="bg-transparent border-none text-sm focus:outline-none w-24"
                                    value={userProfile.mindset_reminder_time || "20:00"}
                                    onChange={handleTimeChange}
                                />
                            </div>
                        )}
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="reminder-mode"
                                checked={userProfile?.mindset_reminder_enabled || false}
                                onCheckedChange={handleReminderToggle}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Today's Section */}
            {isLoading ? (
                <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
                    <Card className="md:col-span-1">
                        <CardHeader>
                            <Skeleton className="h-8 w-48 mb-2" />
                            <Skeleton className="h-4 w-64" />
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-24 w-full" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-24 w-full" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="md:col-span-1 h-64">
                        <CardContent className="p-6">
                            <Skeleton className="h-full w-full" />
                        </CardContent>
                    </Card>
                </div>
            ) : todayLog ? (
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-6 w-6" />
                            All done for today!
                        </CardTitle>
                        <CardDescription>
                            Great job documenting your thoughts. See you tomorrow!
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-background/80 p-4 rounded-xl border shadow-sm">
                            <div className="flex items-start gap-3">
                                <Sparkles className="h-5 w-5 text-purple-500 mt-1 shrink-0" />
                                <div className="space-y-1">
                                    <p className="font-semibold text-sm text-purple-600 uppercase tracking-wider">AI Insight</p>
                                    <p className="text-foreground italic">"{aiSummary}"</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 pt-2">
                            <div className="p-4 bg-background rounded-xl border">
                                <h4 className="flex items-center gap-2 font-medium mb-2 text-sm text-muted-foreground">
                                    <Heart className="h-4 w-4 text-red-400" /> Grateful For
                                </h4>
                                <p>{todayLog.grateful_for}</p>
                            </div>
                            <div className="p-4 bg-background rounded-xl border">
                                <h4 className="flex items-center gap-2 font-medium mb-2 text-sm text-muted-foreground">
                                    <ArrowUpCircle className="h-4 w-4 text-blue-400" /> Improvements
                                </h4>
                                <p>{todayLog.improvements}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
                    <Card className="md:col-span-1">
                        <CardHeader>
                            <CardTitle>Daily Check-in</CardTitle>
                            <CardDescription>What's on your mind today?</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8 p-6">
                            <div className="space-y-4">
                                <Label htmlFor="grateful" className="text-base font-medium text-foreground/80">
                                    What are you grateful for today?
                                </Label>
                                <Textarea
                                    id="grateful"
                                    placeholder="I am grateful for..."
                                    className="min-h-[120px] resize-none text-base p-4"
                                    value={gratefulFor}
                                    onChange={(e) => setGratefulFor(e.target.value)}
                                />
                            </div>
                            <div className="space-y-4">
                                <Label htmlFor="improve" className="text-base font-medium text-foreground/80">
                                    What do you wish to improve on?
                                </Label>
                                <Textarea
                                    id="improve"
                                    placeholder="I want to work on..."
                                    className="min-h-[120px] resize-none text-base p-4"
                                    value={improvements}
                                    onChange={(e) => setImprovements(e.target.value)}
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full gap-2">
                                {isSubmitting ? (
                                    <>
                                        <Sparkles className="h-4 w-4 animate-spin" /> Analyzing & Saving...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="h-4 w-4" /> Save Journal
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card className="md:col-span-1 bg-muted/30 border-muted">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-yellow-500" />
                                Why Journal?
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground space-y-4">
                            <p>
                                <strong>Gratitude</strong> improves sleep, mood, and immunity. It shifts focus from what your body <em>isn't</em> to what it <em>is</em> capable of.
                            </p>
                            <p>
                                <strong>Self-reflection</strong> on improvements helps you identify patterns and break through plateaus in your fitness journey.
                            </p>
                            <div className="mt-4 p-3 bg-background rounded border text-xs italic">
                                "The body achieves what the mind believes."
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* History Section */}
            <div className="space-y-4 pt-8">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Past Entries
                </h2>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {isLoading ? (
                        <>
                            <Skeleton className="h-32 w-full" />
                            <Skeleton className="h-32 w-full" />
                            <Skeleton className="h-32 w-full" />
                        </>
                    ) : mindsetLogs.filter(log => log.id !== todayLog?.id).map((log) => (
                        <Card key={log.id} className="flex flex-col">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-medium">
                                    {format(parseISO(log.date), "MMMM do, yyyy")}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 flex-1 text-sm">
                                <div>
                                    <span className="font-semibold text-muted-foreground text-xs uppercase">Grateful For:</span>
                                    <p className="line-clamp-3">{log.grateful_for}</p>
                                </div>
                                <div>
                                    <span className="font-semibold text-muted-foreground text-xs uppercase">Improvement:</span>
                                    <p className="line-clamp-3">{log.improvements}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {!isLoading && mindsetLogs.filter(log => log.id !== todayLog?.id).length === 0 && (
                        <div className="col-span-full text-center py-10 text-muted-foreground">
                            {todayLog ? "No past entries yet. You're off to a great start!" : "No entries yet. Start your journey today!"}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
