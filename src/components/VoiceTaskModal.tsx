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
import { Mic, Square, Sparkles, Plus } from 'lucide-react';
import { format, addDays, nextMonday } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';

interface VoiceTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddTasks: (tasks: { title: string; due_date?: string }[]) => void;
}

interface SuggestedTask {
    id: string; // temp id
    title: string;
    due_date?: string; // YYYY-MM-DD
    selected: boolean;
}

export function VoiceTaskModal({ isOpen, onClose, onAddTasks }: VoiceTaskModalProps) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [suggestedTasks, setSuggestedTasks] = useState<SuggestedTask[]>([]);

    // Web Speech API
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (!isOpen) {
            setIsListening(false);
            setTranscript('');
            setSuggestedTasks([]);
            setIsProcessing(false);
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        }
    }, [isOpen]);

    const startListening = () => {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            alert("Speech recognition is not supported in this browser.");
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
            let final = '';
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final += event.results[i][0].transcript;
                } else {
                    interim += event.results[i][0].transcript;
                }
            }
            // Simple accumulation
            setTranscript(() => {
                // Heuristic: If we have a finalized chunk, append it. 
                // However, continuous mode replaces results. 
                // To keep it simple, we'll just track the latest result set for now 
                // or assume user speaks in one go.
                // Let's just blindly set it for the demo-level logic.
                const currentText = Array.from(event.results)
                    // @ts-ignore
                    .map(r => r[0].transcript).join(' ');
                return currentText;
            });
        };

        recognition.onerror = (event: any) => {
            console.error("Speech error", event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsListening(false);
    };

    const processTranscript = () => {
        setIsProcessing(true);
        setTimeout(() => {
            const tasks = basicTaskParser(transcript);
            setSuggestedTasks(tasks);
            setIsProcessing(false);
        }, 800); // Fake AI delay
    };

    const toggleTaskSelection = (id: string) => {
        setSuggestedTasks(prev => prev.map(t =>
            t.id === id ? { ...t, selected: !t.selected } : t
        ));
    };

    const handleCreate = () => {
        const toAdd = suggestedTasks
            .filter(t => t.selected)
            .map(t => ({ title: t.title, due_date: t.due_date }));

        onAddTasks(toAdd);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Voice to Task
                    </DialogTitle>
                    <DialogDescription>
                        Speak your plans and AI will create a task list.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4">
                    {/* Transcript Area */}
                    <div className={`
                        p-4 rounded-lg border min-h-[100px] max-h-[200px] overflow-y-auto text-sm
                        ${isListening ? 'border-primary/50 bg-primary/5' : 'bg-muted/30'}
                    `}>
                        {transcript || <span className="text-muted-foreground italic">Tap microphone to start speaking...</span>}
                    </div>

                    {/* Controls */}
                    <div className="flex justify-center gap-4">
                        {!isListening ? (
                            <Button
                                onClick={startListening}
                                variant={transcript ? "outline" : "default"}
                                className="rounded-full w-12 h-12 p-0"
                            >
                                <Mic className="h-5 w-5" />
                            </Button>
                        ) : (
                            <Button
                                onClick={stopListening}
                                variant="destructive"
                                className="rounded-full w-12 h-12 p-0 animate-pulse"
                            >
                                <Square className="h-5 w-5 fill-current" />
                            </Button>
                        )}
                    </div>

                    {/* Action: Analyze */}
                    {transcript && !isListening && suggestedTasks.length === 0 && (
                        <Button onClick={processTranscript} disabled={isProcessing} className="w-full">
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
                        <div className="space-y-2 animate-in slide-in-from-bottom-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase">Suggested Tasks</Label>
                            <ScrollArea className="h-[200px] w-full rounded-md border p-2">
                                <div className="space-y-2">
                                    {suggestedTasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className="flex items-start space-x-2 p-2 rounded hover:bg-muted/50 transition-colors"
                                        >
                                            <Checkbox
                                                id={task.id}
                                                checked={task.selected}
                                                onCheckedChange={() => toggleTaskSelection(task.id)}
                                            />
                                            <div className="grid gap-1.5 leading-none">
                                                <label
                                                    htmlFor={task.id}
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                >
                                                    {task.title}
                                                </label>
                                                {task.due_date && (
                                                    <p className="text-xs text-muted-foreground">
                                                        Due: {task.due_date}
                                                    </p>
                                                )}
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
                            Add {suggestedTasks.filter(t => t.selected).length} Tasks
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Basic Heuristic Parser (Simulating AI)
function basicTaskParser(text: string): SuggestedTask[] {
    const cleanText = text.toLowerCase();

    // 1. Split by common delimiters
    // "and", "then", "also", or pauses (periods)
    const chunks = cleanText.split(/\s+and\s+|\s+then\s+|\s+also\s+|\.\s+/);

    return chunks.map((chunk, index) => {
        let title = chunk.trim();
        if (!title) return null;

        // 2. Extract Date (Very basic)
        let dueDate: string | undefined = undefined;
        const today = new Date();

        if (title.includes('tomorrow')) {
            dueDate = format(addDays(today, 1), 'yyyy-MM-dd');
            title = title.replace('tomorrow', '').trim();
        } else if (title.includes('today')) {
            dueDate = format(today, 'yyyy-MM-dd');
            title = title.replace('today', '').trim();
        } else if (title.includes('next week')) {
            dueDate = format(nextMonday(today), 'yyyy-MM-dd');
            title = title.replace('next week', '').trim();
        } else if (title.includes('weekend')) {
            // Next Saturday
            // Simplification: just pick a date
        }

        // Clean up leading verbs if needed (optional)
        title = title.charAt(0).toUpperCase() + title.slice(1);

        return {
            id: `st-${index}-${Date.now()}`,
            title,
            due_date: dueDate,
            selected: true
        };
    }).filter(Boolean) as SuggestedTask[];
}
