import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useData, UserProfile } from "@/features/data/DataContext";
import { useAuth } from "@/features/auth/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, MoreVertical, Trash2, KeyRound, RefreshCw, Loader2, UserPlus } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { BellRing } from "lucide-react";

export default function ManageUsers() {
    const { userProfile, fetchAllUsers, isLoading: isContextLoading } = useData();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [users, setUsers] = useState<UserProfile[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [manualName, setManualName] = useState("");
    const [manualPassword, setManualPassword] = useState("");
    const [manualTier, setManualTier] = useState("free_user");

    // Temp client for manual creation (avoids logging out admin)
    const tempClient = createClient(
        'https://mhwxdqcnlibqxeiyyuxl.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1od3hkcWNubGlicXhlaXl5dXhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MTMyOTYsImV4cCI6MjA4NDk4OTI5Nn0.lRUMvDKer6xGl4h5af9E2rlKzxc1FhmNbH9osihx-14',
        { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
    );

    // Notification State
    const [notifyOpen, setNotifyOpen] = useState(false);
    const [notifyTitle, setNotifyTitle] = useState("");
    const [notifyMessage, setNotifyMessage] = useState("");
    const [isSending, setIsSending] = useState(false);

    // Guard: Redirect if not admin
    useEffect(() => {
        if (!isContextLoading && (userProfile.subscription_tier || '').toLowerCase() !== 'admin') {
            toast.error("Unauthorized Access");
            navigate("/");
        }
    }, [userProfile, isContextLoading, navigate]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const data = await fetchAllUsers();
            setUsers(data);
            setFilteredUsers(data);
            setLoading(false);
        };
        load();
    }, [refreshTrigger, fetchAllUsers]);

    useEffect(() => {
        const lowerSearch = search.toLowerCase();
        const filtered = users.filter(u =>
            (u.displayName?.toLowerCase() || "").includes(lowerSearch) ||
            (u.email?.toLowerCase() || "").includes(lowerSearch)
        );
        setFilteredUsers(filtered);
    }, [search, users]);

    const handleSubscriptionChange = async (userId: string, newTier: string) => {
        const { error } = await supabase.from('profiles').update({ subscription_tier: newTier }).eq('id', userId);
        if (error) {
            toast.error(`Failed to update subscription: ${error.message}`);
        } else {
            toast.success("Subscription updated!");
            setRefreshTrigger(prev => prev + 1);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

        // NOTE: Deleting from 'profiles' might not delete from 'auth.users' strictly depending on FK setup. 
        // Admin API is needed to delete from auth properly, which requires service role key (backend). 
        // Client-side, we can delete the profile row. Auth user remains but can't login effectively or profile is gone.
        // For a client-side only demo, deleting profile is the best we can do without Edge Functions.

        const { error } = await supabase.from('profiles').delete().eq('id', userId);
        if (error) {
            toast.error(`Failed to delete profile: ${error.message}`);
        } else {
            toast.success("User profile deleted.");
            setRefreshTrigger(prev => prev + 1);
        }
    };

    const handlePasswordReset = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/account',
        });
        if (error) {
            toast.error(`Failed to send reset email: ${error.message}`);
        } else {
            toast.success(`Reset email sent to ${email}`);
        }
    };

    const getInitials = (name?: string) => {
        if (!name) return "U";
        const parts = name.split(" ");
        if (parts.length > 1) return parts[0][0] + parts[1][0];
        return name[0].toUpperCase();
    };

    const handleSendNotification = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);

        try {
            // 1. Get recipients (active logic could be filtered here, but we will send to ALL for now)
            const recipients = users.map(u => ({
                user_id: u.id,
                title: notifyTitle,
                message: notifyMessage,
                type: 'info'
            }));

            if (recipients.length === 0) {
                toast.error("No users to send to.");
                return;
            }

            // 2. Insert into DB (this triggers Realtime for active users, and saves for offline users)
            const { error } = await supabase.from('notifications').insert(recipients);

            if (error) throw error;

            toast.success(`Notification sent to ${recipients.length} users.`);
            setNotifyOpen(false);
            setNotifyTitle("");
            setNotifyMessage("");
        } catch (error: any) {
            console.error("Error sending notification:", error);
            toast.error(`Failed to send: ${error.message}`);
        } finally {
            setIsSending(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);

        try {
            // 1. Sign Up User (using temp client)
            const { data, error } = await tempClient.auth.signUp({
                email: inviteEmail,
                password: manualPassword,
                options: {
                    data: {
                        full_name: manualName
                        // We set metadata, but will also update Admin profile manually to be sure
                    }
                }
            });

            if (error) throw error;

            if (data.user) {
                // 2. Update Profile privileges (using Main Admin Client)
                // Wait small delay to ensure trigger might have created the row (optional, upsert is safer)
                await new Promise(r => setTimeout(r, 1000));

                const { error: updateError } = await supabase.from('profiles').upsert({
                    id: data.user.id,
                    full_name: manualName,
                    email: inviteEmail,
                    subscription_tier: manualTier
                });

                if (updateError) {
                    console.error("Profile update error:", updateError);
                    toast.warning("User created, but failed to set tier. Please edit manually.");
                } else {
                    toast.success("User created successfully!");
                    setInviteOpen(false);
                    setRefreshTrigger(prev => prev + 1);
                    // Reset form
                    setInviteEmail("");
                    setManualName("");
                    setManualPassword("");
                    setManualTier("free_user");
                }
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSending(false);
        }
    };

    if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

    return (
        <div className="p-6 space-y-6 h-full flex flex-col overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Manage Users</h2>
                    <p className="text-muted-foreground">
                        Total Users: {users.length} | Admins: {users.filter(u => (u.subscription_tier || '').toLowerCase() === 'admin').length}
                    </p>

                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <UserPlus className="h-4 w-4" />
                                Add User
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New User</DialogTitle>
                                <DialogDescription>
                                    Manually create a user account.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                handleCreateUser(e);
                            }} className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Full Name</label>
                                    <Input
                                        placeholder="John Doe"
                                        required
                                        value={manualName}
                                        onChange={(e) => setManualName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Email Address</label>
                                    <Input
                                        type="email"
                                        placeholder="user@example.com"
                                        required
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Password</label>
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                        value={manualPassword}
                                        onChange={(e) => setManualPassword(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Package</label>
                                    <Select value={manualTier} onValueChange={setManualTier}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="free_user">Free User</SelectItem>
                                            <SelectItem value="pro">Pro</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={isSending}>
                                        {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        {isSending ? "Creating..." : "Create User"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={notifyOpen} onOpenChange={setNotifyOpen}>
                        <DialogTrigger asChild>
                            <Button variant="secondary" className="gap-2">
                                <BellRing className="h-4 w-4" />
                                Broadcast
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Broadcast Notification</DialogTitle>
                                <DialogDescription>
                                    Send a notification to all registered users.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSendNotification} className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Title</label>
                                    <Input
                                        placeholder="Notification Title"
                                        required
                                        value={notifyTitle}
                                        onChange={(e) => setNotifyTitle(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Message</label>
                                    <Input
                                        placeholder="Message body..."
                                        required
                                        value={notifyMessage}
                                        onChange={(e) => setNotifyMessage(e.target.value)}
                                    />
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={isSending}>
                                        {isSending ? "Sending..." : "Send Broadcast"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search users..."
                            className="pl-9 h-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="icon" onClick={() => setRefreshTrigger(prev => prev + 1)}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Card className="flex-1 overflow-hidden flex flex-col border-border/60 shadow-sm">
                <CardContent className="p-0 flex-1 overflow-auto">
                    <Table>
                        <TableHeader className="bg-muted/50 sticky top-0 z-10">
                            <TableRow>
                                <TableHead className="w-[250px]">User</TableHead>
                                <TableHead>Subscription</TableHead>
                                <TableHead>Joined / Last Login</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((u) => (
                                    <TableRow key={u.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9 border">
                                                    <AvatarImage src={u.photoURL} />
                                                    <AvatarFallback>{getInitials(u.displayName)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm">{u.displayName || "No Name"}</span>
                                                    <span className="text-xs text-muted-foreground">{u.email || "No Email"}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={u.subscription_tier === 'admin' ? "destructive" : u.subscription_tier === 'pro' ? "default" : "secondary"} className="capitalize">
                                                {u.subscription_tier === 'free_user' ? 'Free' : u.subscription_tier}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-xs text-muted-foreground">
                                                {u.last_sign_in_at ? (
                                                    <div className="flex items-center gap-1" title={u.last_sign_in_at}>
                                                        <ClockIcon className="h-3 w-3" />
                                                        {formatDistanceToNow(parseISO(u.last_sign_in_at))} ago
                                                    </div>
                                                ) : "Never"}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handlePasswordReset(u.email || "")} disabled={!u.email}>
                                                        <KeyRound className="mr-2 h-4 w-4" />
                                                        Reset Password
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-red-600 focus:text-red-600"
                                                        onClick={() => handleDeleteUser(u.id || "")}
                                                        disabled={u.id === user?.id} // Prevent self-delete
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete User
                                                    </DropdownMenuItem>

                                                    <DropdownMenuContent className="w-40" side="left">
                                                        <DropdownMenuItem onClick={() => handleSubscriptionChange(u.id || "", "free_user")}>
                                                            Set to Free
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleSubscriptionChange(u.id || "", "pro")}>
                                                            Set to Pro
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleSubscriptionChange(u.id || "", "admin")}>
                                                            Set to Admin
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenuContent>
                                            </DropdownMenu>

                                            {/* Quick Actions */}
                                            <div className="flex items-center justify-end gap-1 mt-1 sm:hidden">
                                                {/* Mobile quick actions if needed */}
                                            </div>

                                            {/* Desktop inline tier switcher for quick access could go here */}
                                            <Select defaultValue={u.subscription_tier} onValueChange={(val) => handleSubscriptionChange(u.id || "", val)}>
                                                <SelectTrigger className="w-[100px] h-7 text-xs ml-auto mt-2 hidden">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="free_user">Free</SelectItem>
                                                    <SelectItem value="pro">Pro</SelectItem>
                                                    <SelectItem value="admin">Admin</SelectItem>
                                                </SelectContent>
                                            </Select>

                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

function ClockIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    )
}
