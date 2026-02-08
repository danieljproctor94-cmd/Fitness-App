import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Coffee, Bell } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function WorkTimer({ compact = false }: { compact?: boolean }) {
    const [seconds, setSeconds] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [permission, setPermission] = useState(() =>
        'Notification' in window ? Notification.permission : 'default'
    );

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (isActive) {
            interval = setInterval(() => {
                setSeconds(prev => {
                    const newValue = prev + 1;

                    // Check for hour mark (3600 seconds)
                    if (newValue > 0 && newValue % 3600 === 0) {
                        sendNotification();
                    }

                    return newValue;
                });
            }, 1000);
        } else if (!isActive && interval) {
            clearInterval(interval);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive]);

    const requestPermission = async () => {
        if (!("Notification" in window)) {
            toast.error("This browser does not support desktop notifications");
            return;
        }

        const result = await Notification.requestPermission();
        setPermission(result);

        if (result === "granted") {
            toast.success("Notifications enabled!");
            new Notification("Work Timer Ready", {
                body: "We'll notify you every hour to take a break.",
                icon: "/favicon.ico"
            });
        }
    };

    const sendNotification = () => {
        if (permission === "granted") {
            new Notification("Time for a break!", {
                body: "You've been working for an hour. Time to stretch!",
                icon: "/favicon.ico",
                requireInteraction: true
            });
        } else {
            toast("Time for a break! (Enable notifications for better alerts)", {
                icon: <Coffee className="h-4 w-4" />
            });
        }
    };

    const toggleTimer = () => {
        if (!isActive && permission === "default") {
            requestPermission();
        }
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        setIsActive(false);
        setSeconds(0);
    };

    const formatTime = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;

        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
    };

    if (compact) {
        return (
            <div className="flex items-center gap-1.5 bg-muted/40 rounded-full px-2 py-0.5 h-7 border shadow-sm transition-all hover:bg-muted/60">
                {isActive && (
                    <span className="relative flex h-1.5 w-1.5 mr-0.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
                    </span>
                )}

                <div className="text-[10px] sm:text-xs font-mono font-medium tabular-nums min-w-[3.5rem] text-center tracking-tight">
                    {formatTime(seconds)}
                </div>

                <div className="flex items-center gap-0.5 border-l pl-1.5 border-border/50">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-5 w-5 hover:bg-transparent transition-transform active:scale-95", isActive ? "text-amber-500" : "text-foreground")}
                        onClick={toggleTimer}
                        title={isActive ? "Pause" : "Start"}
                    >
                        {isActive ? <Pause className="h-2.5 w-2.5 fill-current" /> : <Play className="h-2.5 w-2.5 fill-current" />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-muted-foreground hover:text-foreground transition-transform active:scale-95"
                        onClick={resetTimer}
                        title="Reset"
                    >
                        <RotateCcw className="h-2.5 w-2.5" />
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 px-4">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Work Timer</CardTitle>
                {isActive ? (
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                ) : (
                    <ClockIcon className="h-3 w-3 text-muted-foreground" />
                )}
            </CardHeader>
            <CardContent className="px-4 pb-4">
                <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="text-3xl font-mono font-bold tracking-widest tabular-nums text-foreground/90">
                        {formatTime(seconds)}
                    </div>

                    <div className="flex items-center gap-2 w-full">
                        <Button
                            variant={isActive ? "secondary" : "default"}
                            size="sm"
                            className={cn("flex-1 h-8 text-xs font-medium", isActive && "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20")}
                            onClick={toggleTimer}
                        >
                            {isActive ? (
                                <><Pause className="h-3 w-3 mr-1.5" /> Pause</>
                            ) : (
                                <><Play className="h-3 w-3 mr-1.5" /> Start</>
                            )}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={resetTimer} title="Reset">
                            <RotateCcw className="h-3 w-3" />
                        </Button>
                    </div>

                    {permission === "default" && (
                        <div
                            className="text-[10px] text-muted-foreground flex items-center gap-1 cursor-pointer hover:text-primary transition-colors mt-1"
                            onClick={requestPermission}
                        >
                            <Bell className="h-2.5 w-2.5" /> Enable alerts
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function ClockIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    );
}
