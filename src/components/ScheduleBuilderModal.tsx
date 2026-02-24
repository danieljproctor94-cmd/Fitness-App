import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useData } from "@/features/data/DataContext";
import { format, addDays } from "date-fns";
import { CalendarCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

const AVAILABLE_ACTIVITIES = ["Running", "Gym", "Walking", "Swimming", "Tennis", "Golf", "Football"];

export function ScheduleBuilderModal() {
    const { addWorkout } = useData();
    const [open, setOpen] = useState(false);
    
    // Form State
    const [workStart, setWorkStart] = useState("09:00");
    const [workEnd, setWorkEnd] = useState("17:00");
    const [startingWeight, setStartingWeight] = useState("");
    const [targetWeight, setTargetWeight] = useState("");
    const [activities, setActivities] = useState<string[]>(["Gym"]);
    
    const [isSubmitting, setIsSubmitting] = useState(false);

    const toggleActivity = (activity: string) => {
        setActivities(prev => prev.includes(activity) ? prev.filter(a => a !== activity) : [...prev, activity]);
    };

    const calculateWorkoutTime = () => {
        try {
            const [endH] = workEnd.split(":").map(Number);
            const [startH] = workStart.split(":").map(Number);
            
            if (endH < 19) return `${String(endH + 1).padStart(2, '0')}:00`;
            else if (startH > 7) return `${String(startH - 2).padStart(2, '0')}:00`;
        } catch(e) {}
        return "18:00";
    };

    const handleBuildSchedule = async () => {
        if (!startingWeight || !targetWeight) {
            toast.error("Please enter your weight goals.");
            return;
        }
        if (activities.length === 0) {
            toast.error("Please select at least one activity.");
            return;
        }

        setIsSubmitting(true);
        const workoutTime = calculateWorkoutTime();
        const today = new Date();
        let activeDaysCount = 0;

        try {
            for (let i = 1; i <= 7; i++) {
                const sessionDate = addDays(today, i);
                const dateStr = format(sessionDate, "yyyy-MM-dd");
                const isRestDay = i === 3 || i === 7;

                if (isRestDay) {
                    await addWorkout({
                        name: "Rest & Recovery", date: dateStr, time: "08:00", duration: "0", exercises: []
                    });
                } else {
                    const activity = activities[activeDaysCount % activities.length];
                    activeDaysCount++;

                    await addWorkout({
                        name: `${activity} Session`, date: dateStr, time: workoutTime, duration: "45",
                        exercises: [{ id: crypto.randomUUID(), name: activity, sets: [{ id: crypto.randomUUID(), weight: 0, reps: 1 }] }]
                    });
                }
            }
            toast.success("7-Day Schedule generated!");
            setOpen(false);
        } catch (error) {
            toast.error("Failed to generate schedule.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg shadow-blue-500/30 border-0 transition-all font-semibold">
                    <CalendarCheck className="h-4 w-4" />
                    <span className="hidden sm:inline">Build 7-Day Schedule</span>
                    <span className="sm:hidden">Schedule</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Build Your Custom Schedule</DialogTitle>
                    <DialogDescription>
                        We'll generate a 7-day personalized workout plan mapped to your working hours.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startingWeight">Starting Weight (kg)</Label>
                            <Input id="startingWeight" type="number" placeholder="80" value={startingWeight} onChange={e => setStartingWeight(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="targetWeight">Target Weight (kg)</Label>
                            <Input id="targetWeight" type="number" placeholder="75" value={targetWeight} onChange={e => setTargetWeight(e.target.value)} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="workStart">Work Start Time</Label>
                            <Input id="workStart" type="time" value={workStart} onChange={e => setWorkStart(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="workEnd">Work End Time</Label>
                            <Input id="workEnd" type="time" value={workEnd} onChange={e => setWorkEnd(e.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <Label>Activities You Enjoy</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-muted/30 p-4 rounded-xl border border-border/50">
                            {AVAILABLE_ACTIVITIES.map(activity => (
                                <div key={activity} className="flex items-center space-x-2">
                                    <Checkbox id={`act-${activity}`} checked={activities.includes(activity)} onCheckedChange={() => toggleActivity(activity)} />
                                    <label htmlFor={`act-${activity}`} className="text-sm font-medium leading-none cursor-pointer">{activity}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleBuildSchedule} disabled={isSubmitting} className="w-full sm:w-auto">
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isSubmitting ? "Generating..." : "Generate 7-Day Plan"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
