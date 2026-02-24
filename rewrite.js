const fs = require('fs');
const path = 'C:/Users/info/.gemini/antigravity/brain/Fitness App Web/src/pages/Mindset.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  'import { useState, useEffect, useMemo } from "react";',
  'import { useState, useEffect, useMemo, useRef } from "react";'
);
content = content.replace(
  'import { Brain, Sparkles, Calendar, Heart, ArrowUpCircle, CheckCircle, Flame, Bell, Clock } from "lucide-react";',
  'import { Brain, Sparkles, Calendar, Heart, ArrowUpCircle, CheckCircle, Flame, Bell, Clock, Mic } from "lucide-react";'
);

const findLogic = /\s*const \[aiSummary[\s\S]*?const streak = useMemo\(\(\) => calculateStreak\(mindsetLogs\), \[mindsetLogs\]\);/;
const replaceLogic = `
    const [aiSummary, setAiSummary] = useState<string | null>(null);
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
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, []);

    const streak = useMemo(() => calculateStreak(mindsetLogs), [mindsetLogs]);`;
content = content.replace(findLogic, replaceLogic);

const findGratefulUI = /<Label htmlFor="grateful"[\s\S]*?<\/Label>/;
const replaceGratefulUI = `<div className="flex items-center justify-between mb-4">
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
                                        <Mic className={\`h-4 w-4 \${recordingField === 'grateful' ? 'animate-pulse' : ''}\`} />
                                        {recordingField === 'grateful' ? 'Listening...' : 'Speak'}
                                    </Button>
                                </div>`;
content = content.replace(findGratefulUI, replaceGratefulUI);

const findImproveUI = /<Label htmlFor="improve"[\s\S]*?<\/Label>/;
const replaceImproveUI = `<div className="flex items-center justify-between mb-4">
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
                                        <Mic className={\`h-4 w-4 \${recordingField === 'improve' ? 'animate-pulse' : ''}\`} />
                                        {recordingField === 'improve' ? 'Listening...' : 'Speak'}
                                    </Button>
                                </div>`;
content = content.replace(findImproveUI, replaceImproveUI);

fs.writeFileSync(path, content, 'utf8');
console.log('done setup');
