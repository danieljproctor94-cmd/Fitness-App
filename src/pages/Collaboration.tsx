import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Users, Mail, Check, Clock, RefreshCcw, MoreVertical, Trash } from "lucide-react";
import { useData } from "@/features/data/DataContext";
import { useAuth } from "@/features/auth/AuthContext";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";


export default function Collaboration() {
    const { collaborations, sendFriendRequest, acceptFriendRequest, resendFriendRequest, removeFriend } = useData();
    const { user } = useAuth();
    const [inviteEmail, setInviteEmail] = useState("");
    const [isInviting, setIsInviting] = useState(false);

    // Filter different statuses
    const acceptedFriends = collaborations.filter(c => c.status === 'accepted');

    // Get IDs of current friends to filter out redundant pending requests
    const friendIds = new Set(acceptedFriends.map(c => c.profile?.id).filter(Boolean));

    const pendingRequests = collaborations.filter(c => c.status === 'pending');

    // Derived lists helpers
    // Only show pending sent if they are NOT already a friend
    const sentPending = pendingRequests.filter(c => c.requester_id === user?.id && !friendIds.has(c.profile?.id));

    // Only show received requests if they are NOT already a friend (rare edge case of double invite)
    const receivedPending = pendingRequests.filter(c => c.receiver_id === user?.id && !friendIds.has(c.profile?.id));

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
                <h1 className="text-3xl font-bold tracking-tight">My Team</h1>
                <p className="text-muted-foreground">Build your fitness circle and share progress.</p>
            </header>

            <Tabs defaultValue="team" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="team">My Team ({acceptedFriends.length})</TabsTrigger>

                    <TabsTrigger value="received">
                        Requests
                        {receivedPending.length > 0 && (
                            <span className="ml-2 bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded-full">
                                {receivedPending.length}
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
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => toast.info("Chat feature coming soon!")}>
                                                <Mail className="mr-2 h-4 w-4" /> Message
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                                onClick={() => {
                                                    if (confirm(`Are you sure you want to remove ${collab.profile?.displayName || 'this user'}?`)) {
                                                        removeFriend(collab.id);
                                                    }
                                                }}
                                            >
                                                <Trash className="mr-2 h-4 w-4" /> Remove Teammate
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </CardContent>
                            </Card>
                        ))}

                        {/* Pending Invites Section (Always Visible if there are pending sent requests) */}
                        {sentPending.length > 0 && (
                            <div className="col-span-full mt-4 space-y-4">
                                <div className="flex items-center justify-between border-b pb-2">
                                    <h3 className="text-sm font-medium text-muted-foreground">Pending Invites ({sentPending.length})</h3>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    {sentPending.map((collab) => (
                                        <Card key={collab.id}>
                                            <CardContent className="p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600">
                                                        <Clock className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm">
                                                            {collab.profile?.displayName || "User"}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Invitation Sent • Pending
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button size="sm" variant="outline" onClick={() => resendFriendRequest && resendFriendRequest(collab.id)} className="gap-1">
                                                    <RefreshCcw className="h-3 w-3" /> Resend
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Empty State (Only if NO friends and NO pending) */}
                        {acceptedFriends.length === 0 && sentPending.length === 0 && (
                            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground col-span-full border rounded-lg bg-card/30 border-dashed">
                                <Users className="h-10 w-10 mb-2 opacity-50" />
                                <p>No friends yet. Start by inviting someone!</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="received">
                    <div className="grid gap-4">
                        {receivedPending.length === 0 ? (
                            <div className="text-center p-12 text-muted-foreground">
                                No new requests.
                            </div>
                        ) : (
                            receivedPending.map((collab) => (
                                <Card key={collab.id}>
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-600">
                                                <Mail className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">
                                                    {collab.profile?.displayName || "User"}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Sent you a request
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={() => acceptFriendRequest(collab.id)} className="gap-1">
                                                <Check className="h-3 w-3" /> Accept
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>


            </Tabs>


        </div>
    );
}
