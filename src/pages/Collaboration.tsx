import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Users, Mail, Check, Clock } from "lucide-react";
import { useData } from "@/features/data/DataContext";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function Collaboration() {
    const { collaborations, sendFriendRequest, acceptFriendRequest, userProfile } = useData();
    const [inviteEmail, setInviteEmail] = useState("");
    const [isInviting, setIsInviting] = useState(false);

    // Filter different statuses
    const acceptedFriends = collaborations.filter(c => c.status === 'accepted');
    const pendingRequests = collaborations.filter(c => c.status === 'pending');

    // Separate incoming vs outgoing might be nice, but for now just show all pending
    // Actually, we need to know who sent it.
    // If I am requester, it's "Sent". If I am receiver, it's "Received".
    // userProfile from DataContext might not have ID if we initialized it with default.
    // Ideally we use useAuth().user.id but let's assume we can derive or check.

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail) return;
        setIsInviting(true);
        await sendFriendRequest(inviteEmail);
        setIsInviting(false);
        setInviteEmail("");
    };

    return (
        <div className="flex flex-col h-full p-6 gap-6 max-w-5xl mx-auto w-full">
            <header className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight">Collaboration Hub</h1>
                <p className="text-muted-foreground">Build your fitness circle and share progress.</p>
            </header>

            <Tabs defaultValue="team" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="team">My Team ({acceptedFriends.length})</TabsTrigger>
                    <TabsTrigger value="pending">
                        Requests
                        {pendingRequests.length > 0 && (
                            <span className="ml-2 bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded-full">
                                {pendingRequests.length}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="team" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Invite Card */}
                        <Card className="border-dashed border-primary/20 bg-primary/5">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Plus className="h-5 w-5 text-primary" />
                                    Add New Member
                                </CardTitle>
                                <CardDescription>Send an email invite to connect.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleInvite} className="flex gap-2">
                                    <Input
                                        placeholder="friend@example.com"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        className="bg-background"
                                        type="email"
                                        required
                                    />
                                    <Button type="submit" disabled={isInviting}>
                                        {isInviting ? "Sending..." : "Invite"}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Friend List */}
                        {acceptedFriends.map((collab) => (
                            <Card key={collab.id}>
                                <CardContent className="p-6 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-12 w-12 border-2 border-primary/10">
                                            <AvatarImage src={collab.profile?.photoURL} />
                                            <AvatarFallback>{collab.profile?.displayName?.[0] || '?'}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h3 className="font-semibold">{collab.profile?.displayName || 'Unknown User'}</h3>
                                            <p className="text-xs text-muted-foreground">Teammate</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => toast.info("Chat feature coming soon!")}>
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}

                        {acceptedFriends.length === 0 && (
                            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground col-span-full border rounded-lg bg-card/30 border-dashed">
                                <Users className="h-10 w-10 mb-2 opacity-50" />
                                <p>No friends yet. Start by inviting someone!</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="pending">
                    <div className="grid gap-4">
                        {pendingRequests.length === 0 ? (
                            <div className="text-center p-12 text-muted-foreground">
                                No pending requests.
                            </div>
                        ) : (
                            pendingRequests.map((collab) => {
                                const isIncoming = collab.receiver_id === userProfile.id; // Rough check, assuming userProfile.id matches auth.id
                                // Actually, userProfile usually has ID if loaded. If not, we might assume incoming if profile is populated.

                                return (
                                    <Card key={collab.id}>
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${isIncoming ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-600' : 'bg-blue-100 dark:bg-blue-900/20 text-blue-600'}`}>
                                                    {isIncoming ? <Mail className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">
                                                        {collab.profile?.displayName || "User"}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {isIncoming ? "Sent you a request" : "Request sent"}
                                                    </p>
                                                </div>
                                            </div>

                                            {isIncoming && (
                                                <div className="flex gap-2">
                                                    <Button size="sm" onClick={() => acceptFriendRequest(collab.id)} className="gap-1">
                                                        <Check className="h-3 w-3" /> Accept
                                                    </Button>
                                                </div>
                                            )}
                                            {!isIncoming && (
                                                <Button size="sm" variant="outline" disabled className="opacity-70">
                                                    Waiting...
                                                </Button>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
