
import { useState, useEffect, useMemo, useRef } from "react";
import { format, isSameDay, parseISO, subDays } from "date-fns";
import { useData } from "@/features/data/DataContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Brain, Sparkles, Calendar, Heart, ArrowUpCircle, CheckCircle, Flame, Bell, Clock, Mic, Laugh, Smile, Meh, Frown, Angry, Activity } from "lucide-react";
import { toast } from "sonner";
import { MindsetLog } from "@/features/data/DataContext";
import { useNotifications } from "@/features/notifications/NotificationContext";
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';


// Simple "Mock AI" to generate a summary based on keywords
// In a real app, this would call an OpenAI API endpoint
const generateAISummary = (grateful: string = "", improve: string = "") => {
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


const moodValues: Record<string, number> = { 'awful': 1, 'bad': 2, 'meh': 3, 'good': 4, 'rad': 5 };

const getMoodText = (val: number) => {
    if (val >= 4.5) return 'Rad';
    if (val >= 3.5) return 'Good';
    if (val >= 2.5) return 'Meh';
    if (val >= 1.5) return 'Bad';
    return 'Awful';
};

const getMoodIcon = (mood?: string, className?: string) => {
    switch (mood) {
        case 'rad': return <Laugh className={`text-emerald-500 ${className || 'h-4 w-4'}`} />;
        case 'good': return <Smile className={`text-green-500 ${className || 'h-4 w-4'}`} />;
        case 'meh': return <Meh className={`text-blue-500 ${className || 'h-4 w-4'}`} />;
        case 'bad': return <Frown className={`text-orange-500 ${className || 'h-4 w-4'}`} />;
        case 'awful': return <Angry className={`text-red-500 ${className || 'h-4 w-4'}`} />;
        default: return <Smile className={`text-green-500 opacity-50 ${className || 'h-4 w-4'}`} />;
    }
}

export default function Mindset() {
    const { mindsetLogs, addMindsetLog, isLoading, userProfile, updateUserProfile } = useData();
    const { enablePush, pushEnabled } = useNotifications();
    const [todayLog, setTodayLog] = useState<any | null>(null);
    const [gratefulFor, setGratefulFor] = useState("");
    const [improvements, setImprovements] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [mood, setMood] = useState<'rad' | 'good' | 'meh' | 'bad' | 'awful'>('good');
    const [recordingField, setRecordingField] = useState<'grateful' | 'improve' | null>(null);
    const recognitionRef = useRef<any>(null);

    const toggleRecording = (field: 'grateful' | 'improve') => {
        if (recordingField === field) {
            if (recognitionRef.current) recognitionRef.current.stop();
            setRecordingField(null);
            return;
        }

        if (recordingField && recognitionRef.current) {
            recognitionRef.current.stop();
        }

        const SpeechRecognitionWrapper = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognitionWrapper) {
            toast.error("Speech recognition is not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognitionWrapper();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        let finalTranscript = field === 'grateful' ? gratefulFor : improvements;
        if (finalTranscript && !finalTranscript.endsWith(' ')) finalTranscript += ' ';

        recognition.onstart = () => setRecordingField(field);

        recognition.onresult = (event: any) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript + ' ';
                else interimTranscript += event.results[i][0].transcript;
            }
            const newText = finalTranscript + interimTranscript;
            if (field === 'grateful') setGratefulFor(newText);
            else setImprovements(newText);
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            if (event.error === 'not-allowed') toast.error("Microphone access denied.");
            else if (event.error !== 'aborted') toast.error("Transcription error: " + event.error);
            setRecordingField(null);
        };

        recognition.onend = () => setRecordingField(null);

        recognitionRef.current = recognition;
        try {
            recognition.start();
        } catch(e) {
            console.error(e);
            toast.error("Could not start microphone");
            setRecordingField(null);
        }
    };

    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const streak = useMemo(() => calculateStreak(mindsetLogs), [mindsetLogs]);

    const weeklyAverageMood = useMemo(() => {
        const today = new Date();
        const lastWeek = subDays(today, 7);
        const recentLogs = mindsetLogs.filter(log => log.mood && parseISO(log.date) >= lastWeek);
        if (recentLogs.length === 0) return null;
        const sum = recentLogs.reduce((acc, log) => acc + (moodValues[log.mood!] || 3), 0);
        return sum / recentLogs.length;
    }, [mindsetLogs]);

    const moodChartData = useMemo(() => {
        const sortedLogs = [...mindsetLogs]
            .filter(l => l.mood)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(-30);
        return sortedLogs.map(log => ({
            date: format(parseISO(log.date), 'MMM d'),
            moodValue: moodValues[log.mood!] || 3,
            mood: log.mood
        }));
    }, [mindsetLogs]);

    // Check if logged today
    useEffect(() => {
        const today = new Date();
        const existingLog = mindsetLogs.find(log => isSameDay(parseISO(log.date), today));
        if (existingLog) {
            setTodayLog(existingLog);
            // Regenerate summary for display if strictly needed, or store it.
            // For now we re-generate on fly for the view state
            setAiSummary(generateAISummary(String(existingLog.grateful_for || ""), String(existingLog.improvements || "")));
        }
    }, [mindsetLogs]);

    const handleReminderToggle = async (checked: boolean) => {
        if (checked) {
            if (!pushEnabled) {
                await enablePush();
            }
            if (!("Notification" in window) || Notification.permission !== "granted") {
                toast.error("Notification permission denied. We cannot send you reminders.");
                return;
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
                                    value={userProfile?.mindset_reminder_time || "20:00"}
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
                                <div className="flex items-center justify-between mb-4">
                                    <Label htmlFor="grateful" className="text-lg font-medium text-foreground/80">
                                        What are you grateful for today?
                                    </Label>
                                    <Button
                                        variant={recordingField === 'grateful' ? "destructive" : "secondary"}
                                        size="sm"
                                        className="rounded-full gap-2 transition-all"
                                        onClick={(e) => { e.preventDefault(); toggleRecording('grateful'); }}
                                        type="button"
                                    >
                                        <Mic className={`h-4 w-4 ${recordingField === 'grateful' ? 'animate-pulse' : ''}`} />
                                        {recordingField === 'grateful' ? 'Listening...' : 'Speak'}
                                    </Button>
                                </div>
                                <Textarea
                                    id="grateful"
                                    placeholder="I am grateful for..."
                                    className="min-h-[120px] resize-none text-base p-4 mt-2"
                                    value={gratefulFor}
                                    onChange={(e) => setGratefulFor(e.target.value)}
                                />
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-4">
                                    <Label htmlFor="improve" className="text-lg font-medium text-foreground/80">
                                        What do you wish to improve on?
                                    </Label>
                                    <Button
                                        variant={recordingField === 'improve' ? "destructive" : "secondary"}
                                        size="sm"
                                        className="rounded-full gap-2 transition-all"
                                        onClick={(e) => { e.preventDefault(); toggleRecording('improve'); }}
                                        type="button"
                                    >
                                        <Mic className={`h-4 w-4 ${recordingField === 'improve' ? 'animate-pulse' : ''}`} />
                                        {recordingField === 'improve' ? 'Listening...' : 'Speak'}
                                    </Button>
                                </div>
                                <Textarea
                                    id="improve"
                                    placeholder="I want to work on..."
                                    className="min-h-[120px] resize-none text-base p-4 mt-2"
                                    value={improvements}
                                    onChange={(e) => setImprovements(e.target.value)}
                                />
                                                        </div>
                            
                            <div className="pt-6 border-t border-border/50">
                                <Label className="text-sm font-semibold mb-4 block text-center md:text-left">How are you feeling right now?</Label>
                                <div className="flex flex-wrap items-center justify-around md:justify-start gap-4 md:gap-8">
                                    <button 
                                        onClick={() => setMood('rad')} 
                                        type="button"
                                        className={`flex flex-col items-center gap-2 transition-all hover:scale-110 ${mood === 'rad' ? 'scale-110 opacity-100' : 'opacity-40 hover:opacity-100'}`}
                                    >
                                        <Laugh className={`h-10 w-10 ${mood === 'rad' ? 'text-emerald-500' : ''}`} />
                                        <span className={`text-xs font-bold uppercase tracking-wider ${mood === 'rad' ? 'text-emerald-500' : 'text-muted-foreground'}`}>rad</span>
                                    </button>
                                    <button 
                                        onClick={() => setMood('good')} 
                                        type="button"
                                        className={`flex flex-col items-center gap-2 transition-all hover:scale-110 ${mood === 'good' ? 'scale-110 opacity-100' : 'opacity-40 hover:opacity-100'}`}
                                    >
                                        <Smile className={`h-10 w-10 ${mood === 'good' ? 'text-green-500' : ''}`} />
                                        <span className={`text-xs font-bold uppercase tracking-wider ${mood === 'good' ? 'text-green-500' : 'text-muted-foreground'}`}>good</span>
                                    </button>
                                    <button 
                                        onClick={() => setMood('meh')} 
                                        type="button"
                                        className={`flex flex-col items-center gap-2 transition-all hover:scale-110 ${mood === 'meh' ? 'scale-110 opacity-100' : 'opacity-40 hover:opacity-100'}`}
                                    >
                                        <Meh className={`h-10 w-10 ${mood === 'meh' ? 'text-blue-500' : ''}`} />
                                        <span className={`text-xs font-bold uppercase tracking-wider ${mood === 'meh' ? 'text-blue-500' : 'text-muted-foreground'}`}>meh</span>
                                    </button>
                                    <button 
                                        onClick={() => setMood('bad')} 
                                        type="button"
                                        className={`flex flex-col items-center gap-2 transition-all hover:scale-110 ${mood === 'bad' ? 'scale-110 opacity-100' : 'opacity-40 hover:opacity-100'}`}
                                    >
                                        <Frown className={`h-10 w-10 ${mood === 'bad' ? 'text-orange-500' : ''}`} />
                                        <span className={`text-xs font-bold uppercase tracking-wider ${mood === 'bad' ? 'text-orange-500' : 'text-muted-foreground'}`}>bad</span>
                                    </button>
                                    <button 
                                        onClick={() => setMood('awful')} 
                                        type="button"
                                        className={`flex flex-col items-center gap-2 transition-all hover:scale-110 ${mood === 'awful' ? 'scale-110 opacity-100' : 'opacity-40 hover:opacity-100'}`}
                                    >
                                        <Angry className={`h-10 w-10 ${mood === 'awful' ? 'text-red-500' : ''}`} />
                                        <span className={`text-xs font-bold uppercase tracking-wider ${mood === 'awful' ? 'text-red-500' : 'text-muted-foreground'}`}>awful</span>
                                    </button>
                                </div>
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

            {/* Chart & Stats Section */}
            {(!isLoading && mindsetLogs.length > 0) && (
                <div className="grid gap-6 md:grid-cols-[1fr_2fr] pb-8">
                    {/* Stats Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Activity className="h-5 w-5 text-primary" />
                                Weekly Average Info
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center py-6 h-64">
                            {weeklyAverageMood !== null ? (
                                <div className="text-center space-y-2">
                                    <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Average Mood</div>
                                    <div className="flex justify-center mb-2">
                                        {getMoodIcon(getMoodText(weeklyAverageMood).toLowerCase(), "h-16 w-16")}
                                    </div>
                                    <div className="text-3xl font-bold">{weeklyAverageMood.toFixed(1)}</div>
                                    <div className="text-lg font-medium text-primary uppercase tracking-wide">{getMoodText(weeklyAverageMood)}</div>
                                </div>
                            ) : (
                                <div className="text-muted-foreground text-center">Not enough data to calculate average.</div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Chart Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Brain className="h-5 w-5 text-primary" />
                                Mood Trend
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-64">
                            {moodChartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={moodChartData}>
                                        <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis
                                            domain={[1, 5]}
                                            ticks={[1, 2, 3, 4, 5]}
                                            tickFormatter={(val) => {
                                                switch(val) {
                                                    case 1: return 'Awful';
                                                    case 2: return 'Bad';
                                                    case 3: return 'Meh';
                                                    case 4: return 'Good';
                                                    case 5: return 'Rad';
                                                    default: return '';
                                                }
                                            }}
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            width={50}
                                        />
                                        <RechartsTooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className="bg-background border rounded-lg p-2 shadow-sm text-sm flex items-center gap-2">
                                                            <span className="font-semibold">{data.date}:</span>
                                                            <span className="uppercase">{data.mood}</span>
                                                            {getMoodIcon(data.mood, "h-4 w-4")}
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Line type="monotone" dataKey="moodValue" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground">Log more entries to see your mood trend!</div>
                            )}
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
                            <CardContent className="space-y-3 flex-1 text-sm bg-card text-card-foreground">
                                {log.mood && (
                                    <div className="flex items-center gap-2 mb-2 p-2 rounded-lg bg-muted/50 border flex-wrap w-fit">
                                        <span className="font-semibold text-muted-foreground text-xs uppercase">Mood:</span>
                                        <div className="flex items-center gap-1">
                                            {getMoodIcon(log.mood, "h-4 w-4")}
                                            <span className="font-bold text-xs uppercase tracking-wider">{log.mood}</span>
                                        </div>
                                    </div>
                                )}
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


