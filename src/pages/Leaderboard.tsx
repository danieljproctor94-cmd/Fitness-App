
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Medal, Crown, Activity, Scale, Share2, Users, Globe } from "lucide-react";
import { useData } from "@/features/data/DataContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";


export default function Leaderboard() {
    const { userProfile, workouts, measurements } = useData();
    const [viewMode, setViewMode] = useState("weight");
    const [filterMode, setFilterMode] = useState("friends"); // friends | everyone

    // 1. Calculate Active Minutes
    const activeMinutes = workouts.reduce((acc, curr) => acc + (parseInt(curr.duration) || 0), 0);

    // 2. Calculate Weight Change (Current - First Recorded)
    const sortedMeasurements = [...measurements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let weightChange = 0;
    if (sortedMeasurements.length > 1) {
        const first = sortedMeasurements[0].weight;
        const current = sortedMeasurements[sortedMeasurements.length - 1].weight;
        weightChange = parseFloat((current - first).toFixed(1));
    }

    // 3. Prepare List Data

    const currentUser = {
        id: "self",
        name: userProfile.displayName || "You",
        avatar: userProfile.photoURL,
        weightChange,
        activeMinutes,
        trend: weightChange < 0 ? "up" : "down",
        isCurrentUser: true
    };

    const allUsers = [currentUser];

    // 4. Sort based on View Mode
    const sortedUsers = allUsers.sort((a, b) => {
        if (viewMode === "weight") {
            // Sort by most negative (weight loss) first
            return a.weightChange - b.weightChange;
        } else {
            // Sort by most active minutes first
            return b.activeMinutes - a.activeMinutes;
        }
    });

    const getRankIcon = (index: number) => {
        if (index === 0) return <Crown className="h-6 w-6 text-yellow-500 fill-yellow-500" />;
        if (index === 1) return <Medal className="h-6 w-6 text-gray-400 fill-gray-400" />;
        if (index === 2) return <Medal className="h-6 w-6 text-amber-600 fill-amber-600" />;
        return <span className="text-lg font-bold w-6 text-center text-muted-foreground">{index + 1}</span>;
    };

    const displayValue = (user: any) => {
        if (viewMode === "weight") {
            const val = user.weightChange;
            const color = val <= 0 ? "text-green-500" : "text-red-500";
            const sign = val > 0 ? "+" : "";
            const finalColor = val === 0 ? "text-muted-foreground" : color;
            return <span className={`font-bold ${finalColor}`}>{sign}{val} kg</span>;
        } else {
            return <span className="font-bold">{user.activeMinutes} mins</span>;
        }
    };

    const handleInvite = () => {
        // Simulating copy to clipboard
        navigator.clipboard.writeText("Join me on FitnessApp! https://fitnessapp.com/join?ref=" + (userProfile.id || "user"));
        toast.success("Invite link copied to clipboard!");
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
                        <p className="text-muted-foreground">Compare performance with your fitness circle.</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button onClick={handleInvite} className="gap-2">
                            <Share2 className="h-4 w-4" /> Invite Friends
                        </Button>
                    </div>
                </div>

                {/* Filters & Toggles */}
                <div className="flex flex-col sm:flex-row justify-between gap-4 items-center bg-muted/30 p-2 rounded-lg border">
                    <Tabs value={filterMode} onValueChange={(v) => setFilterMode(v as any)} className="w-full sm:w-auto">
                        <TabsList>
                            <TabsTrigger value="friends" className="gap-2"><Users className="h-4 w-4" /> Friends</TabsTrigger>
                            <TabsTrigger value="everyone" className="gap-2"><Globe className="h-4 w-4" /> Everyone</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="flex bg-muted p-1 rounded-lg">
                        <Button
                            variant={viewMode === "weight" ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("weight")}
                            className="gap-2"
                        >
                            <Scale className="h-4 w-4" /> Weight Loss
                        </Button>
                        <Button
                            variant={viewMode === "activity" ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("activity")}
                            className="gap-2"
                        >
                            <Activity className="h-4 w-4" /> Activity
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Stats Card */}
                <Card className="md:col-span-1 border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {viewMode === "weight" ? <Scale className="h-5 w-5 text-primary" /> : <Activity className="h-5 w-5 text-primary" />}
                            Your {viewMode === "weight" ? "Weight Change" : "Activity"}
                        </CardTitle>
                        <CardDescription>
                            {viewMode === "weight" ? "Total change since starting" : "Total active minutes logged"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Global Rank</span>
                            <span className="text-2xl font-bold">#{sortedUsers.findIndex(u => u.id === "self") + 1}</span>
                        </div>
                        <div className="border-t pt-4">
                            <div className="flex items-baseline justify-between">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">Current Value</span>
                                <div className="text-2xl">
                                    {displayValue(currentUser)}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* List */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>{viewMode === "weight" ? "Biggest Losers" : "Most Active"}</CardTitle>
                        <CardDescription>Ranked by {viewMode === "weight" ? "total weight lost" : "total minutes trained"}.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {sortedUsers.map((user, index) => (
                                <div
                                    key={user.id}
                                    className={`flex items - center justify - between p - 4 hover: bg - muted / 50 transition - colors ${user.isCurrentUser ? "bg-primary/10 hover:bg-primary/15" : ""} `}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center justify-center w-8">
                                            {getRankIcon(index)}
                                        </div>
                                        <Avatar className={`h - 10 w - 10 border - 2 ${user.isCurrentUser ? "border-primary" : "border-transparent"} `}>
                                            <AvatarImage src={user.avatar} />
                                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className={`font - medium ${user.isCurrentUser ? "text-primary" : ""} `}>
                                                {user.name} {user.isCurrentUser && "(You)"}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {viewMode === "weight" ? "Fitness Enthusiast" : `${Math.floor(user.activeMinutes / 60)}h ${user.activeMinutes % 60}m logged`}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-right min-w-[80px]">
                                        {displayValue(user)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
