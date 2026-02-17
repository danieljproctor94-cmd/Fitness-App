import { useState } from "react";
import { useData, Goal } from "@/features/data/DataContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Target, Trash2, Edit2, TrendingUp, DollarSign, Plane, Heart, Briefcase, Sparkles, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
    { id: "Money", label: "Money", icon: DollarSign, color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
    { id: "Travel", label: "Travel", icon: Plane, color: "bg-sky-500/10 text-sky-500 border-sky-500/20" },
    { id: "Relationships", label: "Relationships", icon: Heart, color: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
    { id: "Fitness", label: "Fitness", icon: TrendingUp, color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
    { id: "Career", label: "Career", icon: Briefcase, color: "bg-violet-500/10 text-violet-500 border-violet-500/20" },
    { id: "Other", label: "Other", icon: Sparkles, color: "bg-slate-500/10 text-slate-500 border-slate-500/20" },
];

export default function Goals() {
    const { goals, addGoal, updateGoal, deleteGoal, collaborations, shareGoal, removeGoalCollaborator, userProfile } = useData();
    const [isOpen, setIsOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [selectedCollaborators, setSelectedCollaborators] = useState<string[]>([]);
    
    // Form State
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState<string>("Other");
    const [targetDate, setTargetDate] = useState("");
    const [progress, setProgress] = useState(0);

    const [activeTab, setActiveTab] = useState("All");

    const filteredGoals = activeTab === "All" 
        ? goals 
        : goals.filter(g => g.category === activeTab);

    // Reset Form
    const resetForm = () => {
        setSelectedCollaborators([]);
        setTitle("");
        setCategory("Other");
        setTargetDate("");
        setProgress(0);
        setEditingGoal(null);
    };

    const handleEdit = (goal: Goal) => {
        setSelectedCollaborators(goal.shared_with || []);
        setEditingGoal(goal);
        setTitle(goal.title);
        setCategory(goal.category);
        setTargetDate(goal.target_date || "");
        setProgress(goal.progress);
        setIsOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const goalData = {
            title,
            category: category as any,
            target_date: targetDate || undefined,
            progress: Number(progress),
            status: Number(progress) >= 100 ? "completed" : "pending" as any,
            color: CATEGORIES.find(c => c.id === category)?.color || ""
        };

        if (editingGoal) {
            await updateGoal(editingGoal.id, goalData);
            
            // Handle Sharing Updates
            const currentShares = editingGoal.shared_with || [];
            const newShares = selectedCollaborators;
            
            // Find added users
            const addedUsers = newShares.filter(id => !currentShares.includes(id));
            if (addedUsers.length > 0) {
                await Promise.all(addedUsers.map(id => shareGoal(editingGoal.id, id)));
            }
            
            // Find removed users
            const removedUsers = currentShares.filter(id => !newShares.includes(id));
            if (removedUsers.length > 0) {
                if (removeGoalCollaborator) {
                    await Promise.all(removedUsers.map(id => removeGoalCollaborator(editingGoal.id, id)));
                }
            }
        } else {
            const newGoal = await addGoal({
                ...goalData,
                status: "pending",
                color: CATEGORIES.find(c => c.id === category)?.color || ""
            });
            if (newGoal && selectedCollaborators.length > 0) {
                // Share with selected users
                await Promise.all(selectedCollaborators.map(userId => shareGoal(newGoal.id, userId)));
            }
        }
        
        setIsOpen(false);
        resetForm();
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this goal?")) {
            await deleteGoal(id);
        }
    };

        const year = new Date().getFullYear();

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                        {year} Vision Board
                    </h1>
                    <p className="text-muted-foreground mt-1">Design your life and track your ambitions.</p>
                    {(() => {
                        const now = new Date();
                        const start = new Date(now.getFullYear(), 0, 1);
                        const end = new Date(now.getFullYear() + 1, 0, 1);
                        const pct = Math.min(100, Math.max(0, ((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100));
                        return (
                            <div className="mt-4 w-full max-w-xs space-y-1">
                                <div className="flex justify-between text-xs text-muted-foreground font-medium">
                                    <span>{now.getFullYear()} Progress</span>
                                    <span>{pct.toFixed(1)}%</span>
                                </div>
                                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
                                </div>
                            </div>
                        );
                    })()}
                    
                </div>
                <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if(!open) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button size="lg" className="gap-2 shadow-lg hover:shadow-primary/20 transition-all">
                            <Plus className="h-5 w-5" /> Add Goal
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingGoal ? "Edit Goal" : "New Goal"}</DialogTitle>
                            <DialogDescription className="text-muted-foreground">
                                Set your targets and track your progress towards achieving your dreams.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label>Goal Title</Label>
                                <Input 
                                    placeholder="e.g. Save $10,000" 
                                    value={title} 
                                    onChange={(e) => setTitle(e.target.value)} 
                                    required 
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Select value={category} onValueChange={setCategory}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CATEGORIES.map(cat => (
                                                <SelectItem key={cat.id} value={cat.id}>
                                                    <div className="flex items-center gap-2">
                                                        <cat.icon className="h-4 w-4 opacity-50" />
                                                        {cat.label}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Target Date</Label>
                                    <Input 
                                        type="date" 
                                        value={targetDate} 
                                        onChange={(e) => setTargetDate(e.target.value)} 
                                        className="[&::-webkit-calendar-picker-indicator]:invert"
                                        
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <Label>Progress</Label>
                                    <span className="text-muted-foreground">{progress}%</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value={progress} 
                                    onChange={(e) => setProgress(Number(e.target.value))}
                                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                            </div>

                            {/* Team Sharing */}
                            <div className="space-y-2 pt-2 border-t border-border/50">
                                <Label>Share with Team</Label>
                                {(!collaborations || collaborations.length === 0) ? (
                                    <p className="text-xs text-muted-foreground">No team members found. <a href="/settings" className="underline">Add friends</a> to share goals.</p>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border rounded-md">
                                        {collaborations.filter((c, index, self) => c.profile && index === self.findIndex((t) => t.profile?.id === c.profile?.id)).map(collab => {
                                            const friendProfile = collab.profile;
                                            const friendId = collab.requester_id === userProfile?.id ? collab.receiver_id : collab.requester_id;
                                            const isSelected = selectedCollaborators.includes(friendId);
                                            return (
                                                <div key={collab.id} 
                                                     className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${isSelected ? "bg-primary/20 border-primary" : "bg-muted hover:bg-muted/80 border border-transparent"}`}
                                                     onClick={() => {
                                                         if (isSelected) setSelectedCollaborators(prev => prev.filter(id => id !== friendId));
                                                         else setSelectedCollaborators(prev => [...prev, friendId]);
                                                     }}
                                                >
                                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? "bg-primary border-primary" : "border-muted-foreground"}`}>
                                                        {isSelected && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                                                    </div>
                                                    <span className="text-xs font-medium truncate">{friendProfile?.displayName || "Unknown"}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            <Button type="submit" className="w-full">
                                {editingGoal ? "Save Changes" : "Create Goal"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Category Tabs */}
            <Tabs defaultValue="All" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-muted/50 p-1 h-auto flex-wrap justify-start gap-1">
                    <TabsTrigger value="All" className="px-4">All Goals</TabsTrigger>
                    {CATEGORIES.map(cat => (
                        <TabsTrigger key={cat.id} value={cat.id} className="gap-2">
                             <cat.icon className="h-3.5 w-3.5" />
                            {cat.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            {/* Goals Grid */}
            {filteredGoals.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-muted rounded-xl bg-muted/5">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                    <h3 className="text-lg font-medium">No goals found</h3>
                    <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-2">
                        Start visualizing your success by adding your first goal for {year}.
                    </p>
                    <Button variant="outline" className="mt-6" onClick={() => setIsOpen(true)}>
                        Create Goal
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredGoals.map((goal) => {
                        const CategoryIcon = CATEGORIES.find(c => c.id === goal.category)?.icon || Target;
                        const categoryStyle = CATEGORIES.find(c => c.id === goal.category)?.color;

                        return (
                            <Card key={goal.id} className="group relative overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                                {/* Background Gradient Hint */}
                                <div className={cn("absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-transparent to-primary/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-500 pointer-events-none")} />
                                
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <div className={cn("p-2 rounded-lg w-fit", categoryStyle)}>
                                            <CategoryIcon className="h-5 w-5" />
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">

                                            <Button variant="secondary" size="icon" className="h-8 w-8 shadow-sm hover:bg-primary/10 hover:text-primary" onClick={() => handleEdit(goal)}>
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button variant="secondary" size="icon" className="h-8 w-8 shadow-sm hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(goal.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <CardTitle className="mt-3 text-lg font-semibold leading-tight line-clamp-2">
                                        {goal.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs font-medium text-muted-foreground">
                                            <span>Progress</span>
                                            <span>{goal.progress}%</span>
                                        </div>
                                        <Progress value={goal.progress} className="h-2" />
                                        {Array.isArray(goal.shared_with) && goal.shared_with.length > 0 && (
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="flex -space-x-2">
                                                    {goal.shared_with.slice(0, 3).map(uid => {
                                                        const safeUid = String(uid);
                                                        const userCollab = collaborations.find(c => c.profile?.id === safeUid);
                                                        const userP = userCollab?.profile;
                                                        const displayName = userP?.displayName ? String(userP.displayName) : "Unknown";
                                                        return (
                                                            <div key={safeUid} className="w-6 h-6 rounded-full border-2 border-background overflow-hidden bg-muted flex items-center justify-center relative group">
                                                                {userP?.photoURL ? (
                                                                    <img src={String(userP.photoURL)} alt={displayName} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <span className="text-[8px] font-bold text-muted-foreground">{displayName.charAt(0)}</span>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                    {goal.shared_with.length > 3 && (
                                                        <div className="w-6 h-6 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[8px] font-medium text-muted-foreground">
                                                            +{goal.shared_with.length - 3}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-muted-foreground">
                                                    Shared with {(() => {
                                                        const names = goal.shared_with.map(uid => {
                                                            const c = collaborations.find(col => col.profile?.id === String(uid));
                                                            return String(c?.profile?.displayName || "Unknown");
                                                        });
                                                        return names.slice(0, 2).join(", ") + (names.length > 2 ? ` +${names.length - 2}` : "");
                                                    })()}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center justify-between text-xs pt-2 border-t border-border/50">
                                        <span className="text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                                            {goal.category}
                                        </span>
                                        {goal.target_date && (
                                            <span className="text-muted-foreground">
                                                Target: {goal.target_date}
                                            </span>
                                        )}
                                    </div>
                                    
                                    {goal.progress >= 100 && (
                                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                                            <div className="bg-emerald-500 text-white px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                                <CheckCircle2 className="h-5 w-5" /> Completed!
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}











