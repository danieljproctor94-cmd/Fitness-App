import { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mic, Square, Sparkles, Plus, Calendar, Clock } from 'lucide-react';
import { format, addDays, parseISO, getDay } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';


interface VoiceTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddTasks: (tasks: { title: string; due_date?: string; due_time?: string }[]) => void;
}

interface SuggestedTask {
    id: string;
    title: string;
    due_date?: string; // YYYY-MM-DD
    due_time?: string; // HH:mm
    selected: boolean;
}

// Default Prompt if none set by user
const DEFAULT_SYSTEM_PROMPT = `
You are an expert personal assistant task parser. 
Your goal is to extract actionable tasks from user speech.
1. Split complex sentences into multiple distinct tasks.
2. Extract due dates (YYYY-MM-DD) and times (HH:MM).
3. "Tomorrow" = tomorrow's date relative to now. "Tonight" = today's date.
4. SUMMARIZE the task titles to be "Punchy" and short. 
   - Remove "I want to", "please", "go to", "the".
   - Use emojis at the start: 💪 for gym/fitness, 🛒 for shopping, 🍽️ for food, 📅 for meetings, etc.
   - Example: "I want to go to the gym tomorrow" -> { title: "💪 Gym", due_date: "2024-..." }
   - Example: "Dinner with girlfriend" -> { title: "❤️ Date Night w/ GF" }
Return JSON: { "tasks": [ { "title": "...", "due_date": "...", "due_time": "..." } ] }
`;

export function VoiceTaskModal({ isOpen, onClose, onAddTasks }: VoiceTaskModalProps) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [suggestedTasks, setSuggestedTasks] = useState<SuggestedTask[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Web Speech API
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (!isOpen) {
            setIsListening(false);
            setTranscript('');
            setSuggestedTasks([]);
            setIsProcessing(false);
            setError(null);
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        }
    }, [isOpen]);

    const startListening = () => {
        setError(null);
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            setError("Speech recognition is not supported in this browser.");
            return;
        }

        // @ts-ignore
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event: any) => {
            const currentText = Array.from(event.results)
                // @ts-ignore
                .map(r => r[0].transcript).join(' ');

            setTranscript(currentText);
        };

        recognition.onerror = (event: any) => {
            console.error("Speech error", event.error);
            if (event.error === 'not-allowed') {
                setError("Microphone access denied. Please check your browser permissions.");
            } else if (event.error === 'no-speech') {
                // Ignore
            } else {
                setError(`Error: ${event.error}`);
            }
            if (event.error !== 'no-speech') {
                setIsListening(false);
            }
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        try {
            recognition.start();
        } catch (err) {
            console.error(err);
            setError("Failed to start microphone.");
        }
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsListening(false);
    };

    const processTranscript = async () => {
        setIsProcessing(true);
        setError(null);

        try {
            // Check for OpenAI Key
            const apiKey = localStorage.getItem('openai_api_key');

            if (apiKey && apiKey.startsWith('sk-')) {
                await processWithOpenAI(apiKey);
            } else {
                // Fallback to Local Parser
                // toast.info("Using local parser (Add OpenAI Key in settings for better results)");
                await new Promise(r => setTimeout(r, 800)); // Sim delay
                const tasks = smartTaskParser(transcript);
                setSuggestedTasks(tasks);
            }
        } catch (err) {
            console.error(err);
            setError("Failed to analyze. Trying local parser...");
            const tasks = smartTaskParser(transcript);
            setSuggestedTasks(tasks);
        } finally {
            setIsProcessing(false);
        }
    };

    const processWithOpenAI = async (apiKey: string) => {
        const systemPrompt = localStorage.getItem('voice_ai_prompt') || DEFAULT_SYSTEM_PROMPT;
        const now = new Date();
        const context = `Current Date: ${format(now, 'yyyy-MM-dd HH:mm')}. Day: ${format(now, 'EEEE')}.`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo-1106", // or gpt-4-turbo
                messages: [
                    { role: "system", content: systemPrompt + "\n" + context },
                    { role: "user", content: transcript }
                ],
                response_format: { type: "json_object" },
                temperature: 0.1
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`OpenAI Error: ${err}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        const parsed = JSON.parse(content);

        if (parsed.tasks && Array.isArray(parsed.tasks)) {
            const mapped = parsed.tasks.map((t: any, i: number) => ({
                id: `ai-${Date.now()}-${i}`,
                title: t.title,
                due_date: t.due_date,
                due_time: t.due_time,
                selected: true
            }));
            setSuggestedTasks(mapped);
        } else {
            throw new Error("Invalid AI response format");
        }
    };

    const toggleTaskSelection = (id: string) => {
        setSuggestedTasks(prev => prev.map(t =>
            t.id === id ? { ...t, selected: !t.selected } : t
        ));
    };

    const handleCreate = () => {
        const toAdd = suggestedTasks
            .filter(t => t.selected)
            .map(t => ({
                title: t.title,
                due_date: t.due_date,
                due_time: t.due_time
            }));

        onAddTasks(toAdd);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-indigo-500" />
                        Voice to Task
                    </DialogTitle>
                    <DialogDescription>
                        Speak naturally. Example: "Buy milk tomorrow at 5pm."
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4">
                    {/* Transcript Area */}
                    <div className={cn(
                        "p-4 rounded-lg border min-h-[100px] max-h-[200px] overflow-y-auto text-sm transition-colors duration-200 relative",
                        isListening ? 'border-indigo-500/50 bg-indigo-500/5' : 'bg-muted/30'
                    )}>
                        {transcript ? (
                            <p className="whitespace-pre-wrap">{transcript}</p>
                        ) : (
                            <span className="text-muted-foreground italic flex items-center justify-center h-full opacity-50 text-center px-4">
                                {isListening ? "Listening..." : "Tap microphone to start speaking..."}
                            </span>
                        )}
                        {/* Error Overlay */}
                        {error && (
                            <div className="absolute inset-0 bg-background/90 flex items-center justify-center p-4 text-center text-red-500 text-xs font-medium">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Controls */}
                    <div className="flex justify-center gap-4">
                        {!isListening ? (
                            <Button
                                onClick={startListening}
                                variant={transcript ? "outline" : "default"}
                                className={cn(
                                    "rounded-full w-14 h-14 p-0 shadow-lg transition-all hover:scale-105",
                                    !transcript && "animate-pulse"
                                )}
                            >
                                <Mic className="h-6 w-6" />
                            </Button>
                        ) : (
                            <Button
                                onClick={stopListening}
                                variant="destructive"
                                className="rounded-full w-14 h-14 p-0 shadow-lg animate-pulse"
                            >
                                <Square className="h-5 w-5 fill-current" />
                            </Button>
                        )}
                    </div>

                    {/* Action: Analyze */}
                    {transcript && !isListening && suggestedTasks.length === 0 && (
                        <Button
                            onClick={processTranscript}
                            disabled={isProcessing}
                            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700"
                        >
                            {isProcessing ? (
                                <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Sparkles className="mr-2 h-4 w-4" />
                            )}
                            {isProcessing ? "Analyzing..." : "Generate Tasks"}
                        </Button>
                    )}

                    {/* Results */}
                    {suggestedTasks.length > 0 && (
                        <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Suggested Tasks</Label>
                                <span className="text-[10px] text-muted-foreground/70 bg-muted px-2 py-0.5 rounded-full">
                                    {suggestedTasks.length} found
                                </span>
                            </div>
                            <ScrollArea className="h-[220px] w-full rounded-xl border bg-card/50 p-2">
                                <div className="space-y-2">
                                    {suggestedTasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className={cn(
                                                "flex items-start space-x-3 p-3 rounded-lg border transition-all duration-200",
                                                task.selected
                                                    ? "bg-primary/5 border-primary/20"
                                                    : "bg-muted/20 border-transparent opacity-60 hover:opacity-100"
                                            )}
                                        >
                                            <Checkbox
                                                id={task.id}
                                                checked={task.selected}
                                                onCheckedChange={() => toggleTaskSelection(task.id)}
                                                className="mt-1"
                                            />
                                            <div className="grid gap-1.5 leading-none flex-1">
                                                <label
                                                    htmlFor={task.id}
                                                    className="text-sm font-medium leading-none cursor-pointer"
                                                >
                                                    {task.title}
                                                </label>
                                                <div className="flex items-center gap-3">
                                                    {task.due_date && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="flex items-center gap-1 text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-medium">
                                                                <Calendar className="h-3 w-3" />
                                                                {format(parseISO(task.due_date), 'MMM d')}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {task.due_time && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="flex items-center gap-1 text-[10px] text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded font-medium">
                                                                <Clock className="h-3 w-3" />
                                                                {task.due_time}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    {suggestedTasks.length > 0 && (
                        <Button onClick={handleCreate}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Selected
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── SMART LOCAL PARSER (Fallback) ──────────────────────────────────────────

function smartTaskParser(text: string): SuggestedTask[] {
    if (!text) return [];

    let cleanText = text
        .replace(/([0-9])\s*([ap])\.m\./gi, '$1 $2m')
        .replace(/([0-9])\s*([ap])\.m/gi, '$1 $2m')
        .trim();

    cleanText = cleanText.replace(/^(all right|alright|okay|ok|so|hmm)\s*,?\s*/i, '');
    cleanText = cleanText.replace(/\s+(and|so)?\s*(that's\s+it|that\s+is\s+all|that's\s+all)(\s+for\s+now)?.*$/i, '');

    cleanText = cleanText
        .replace(/(\.|!|\?)\s+/g, ' | ')
        .replace(/\s+(?:and|then|so|also|plus)\s+(?=(?:tomorrow|today|tonight|next\s|on\s|at\s|by\s|in\s+\d))/gi, ' | ')
        .replace(/\s+(?:and|then|so|also)\s+(?=(?:I\s|we\s|please\s|start\s))/gi, ' | ')
        .replace(/\s+and\s+(?=(?:call|buy|get|go|make|schedule|book|pay|visit|meet)\b)/gi, ' | ');

    const chunks = cleanText.split('|').map(c => c.trim()).filter(c => c.length > 2);

    return chunks.map((chunk, index) => {
        return parseSingleCommand(chunk, index);
    }).filter(Boolean) as SuggestedTask[];
}

function parseSingleCommand(text: string, index: number): SuggestedTask | null {
    let title = text;
    let dueDate: Date | undefined = undefined;
    let dueTime: string | undefined = undefined;

    const lower = text.toLowerCase();
    const today = new Date();

    // Time
    const timeRegex = /\b(?:at|by)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/gi;
    let timeMatch = timeRegex.exec(lower);
    if (!timeMatch) {
        const lazyTimeRegex = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/gi;
        timeMatch = lazyTimeRegex.exec(lower);
    }
    if (timeMatch) {
        let hour = parseInt(timeMatch[1]);
        const min = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        const ampm = timeMatch[3];
        if (ampm) {
            if (ampm === 'pm' && hour < 12) hour += 12;
            if (ampm === 'am' && hour === 12) hour = 0;
        }
        if (hour >= 0 && hour < 24 && min >= 0 && min < 60) {
            dueTime = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        }
        title = removePhrase(title, timeMatch[0]);
    }

    // Date
    if (lower.includes('tomorrow')) {
        dueDate = addDays(today, 1);
        title = removeWord(title, 'tomorrow');
    }
    else if (lower.includes('today') || lower.includes('tonight')) {
        dueDate = today;
        title = removeWord(title, 'today');
        title = removeWord(title, 'tonight');
    }
    else {
        const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        for (const day of daysOfWeek) {
            if (lower.includes(`next ${day}`)) {
                const currentDay = getDay(today);
                const targetDay = daysOfWeek.indexOf(day);
                let daysToAdd = targetDay - currentDay;
                if (daysToAdd <= 0) daysToAdd += 7;
                daysToAdd += 7;
                dueDate = addDays(today, daysToAdd);
                title = removePhrase(title, `next ${day}`);
                break;
            }
            else if (lower.includes(`on ${day}`) || lower.includes(`this ${day}`)) {
                const currentDay = getDay(today);
                const targetDay = daysOfWeek.indexOf(day);
                let daysToAdd = targetDay - currentDay;
                if (daysToAdd <= 0) daysToAdd += 7;
                dueDate = addDays(today, daysToAdd);
                title = removePhrase(title, `on ${day}`);
                title = removePhrase(title, `this ${day}`);
                break;
            }
        }
    }

    if (!dueDate) {
        const inDaysMatch = lower.match(/in (\d+) days?/);
        if (inDaysMatch) {
            const days = parseInt(inDaysMatch[1]);
            dueDate = addDays(today, days);
            title = removePhrase(title, inDaysMatch[0]);
        }
    }

    // Cleaning
    title = title
        .replace(/^(I\s+want\s+to|I\s+need\s+to|I'd\s+like\s+to|I\s+am\s+going\s+to|I'm\s+going\s+to|please|just|so)\s+/i, '')
        .replace(/^(This\s+is\s+an\s+AI\s+voice\s+test)\s*/i, '')
        .replace(/\s+(I\s+want\s+to|I\s+need\s+to)\s+/i, ' ')
        .replace(/^(go\s+to|going\s+to)\s+(the\s+)?/i, '')
        .replace(/^(a|an|the)\s+/i, '')
        .replace(/\s+(on|at|by|for|with)\s*$/i, '')
        .replace(/^and\s+/i, '')
        .replace(/\s+/g, ' ')
        .trim();

    title = summarizeTitle(title);
    const emoji = getEmojiForTask(title);
    title = title.charAt(0).toUpperCase() + title.slice(1);
    if (emoji) title = `${emoji} ${title}`;

    if (title.length < 2) return null;

    return {
        id: `voice-${Date.now()}-${index}`,
        title,
        due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : undefined,
        due_time: dueTime,
        selected: true
    };
}

function summarizeTitle(text: string): string {
    let t = text;
    t = t.replace(/\bwith\b/gi, 'w/');
    t = t.replace(/\band\b/gi, '&');
    t = t.replace(/\b(my|our|his|her|the|a|an)\b/gi, '');
    t = t.replace(/\bfor\b/gi, '');
    if (t.match(/date\s+night/i)) {
        t = t.replace(/\bdinner\b/gi, '');
    }
    t = t.replace(/\s+/g, ' ').trim();
    return t;
}

function getEmojiForTask(text: string): string {
    const lower = text.toLowerCase();
    const map: Record<string, string> = {
        'gym': '💪', 'workout': '💪', 'exercise': '💪', 'run': '🏃', 'jog': '🏃', 'walk': '🚶',
        'buy': '🛒', 'shop': '🛒', 'groceries': '🛒', 'milk': '🥛', 'food': '🍎',
        'dinner': '🍽️', 'lunch': '🥗', 'breakfast': '🍳', 'eat': '🍽️', 'restaurant': '🍝',
        'call': '📞', 'phone': '📞', 'meet': '🤝', 'meeting': '💼', 'work': '💼', 'email': '📧',
        'clean': '🧹', 'wash': '🧼', 'laundry': '🧺', 'dishes': '🍽️',
        'sleep': '🛌', 'nap': '🛌', 'wake': '⏰', 'up': '⏰',
        'doctor': '🩺', 'dentist': '🦷', 'meds': '💊', 'pill': '💊',
        'pay': '💸', 'bill': '💸', 'bank': '🏦',
        'study': '📚', 'read': '📖', 'learn': '🧠',
        'flight': '✈️', 'travel': '✈️', 'pack': '🧳',
        'date': '❤️', 'movie': '🎬', 'party': '🎉', 'game': '🎮',
        'car': '🚗', 'drive': '🚗', 'fix': '🔧'
    };
    for (const key of Object.keys(map)) {
        if (lower.includes(key)) return map[key];
    }
    return '';
}

function removeWord(text: string, word: string) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    return text.replace(regex, '').replace(/\s+/g, ' ').trim();
}

function removePhrase(text: string, phrase: string) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'gi');
    return text.replace(regex, '').replace(/\s+/g, ' ').trim();
}
