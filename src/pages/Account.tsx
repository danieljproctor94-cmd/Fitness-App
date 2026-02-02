import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useData } from "@/features/data/DataContext";
import { User, Mail, Shield, Crown, Bell } from "lucide-react";
import { useNotifications } from "@/features/notifications/NotificationContext";
import { Switch } from "@/components/ui/switch";
import { uploadAvatar } from "@/lib/storage-utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";

export default function Account() {
    const { userProfile, updateUserProfile } = useData();
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState("");
    const { pushEnabled, enablePush } = useNotifications();
    const { user } = useAuth();

    useEffect(() => {
        if (userProfile.displayName) {
            const parts = userProfile.displayName.split(' ');
            if (parts.length > 0) {
                setFirstName(parts[0]);
                setLastName(parts.slice(1).join(' ')); // Handles multiple middle names correctly
            }
        }
    }, [userProfile]);

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setUploading(true);
        const { url, error } = await uploadAvatar(file, user.id);

        if (error) {
            toast.error("Failed to upload avatar.");
            setUploading(false);
            return;
        }

        if (url) {
            await updateUserProfile({ photoURL: url });
            toast.success("Avatar updated!");
        }
        setUploading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSuccess("");

        try {
            const fullName = `${firstName} ${lastName}`.trim();
            await updateUserProfile({ displayName: fullName });
            setSuccess("Profile updated successfully.");
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async () => {
        // Simulate Upgrade
        // We can't easily replace the confirm() dialog with a toast without a custom dialog component, 
        // but let's replace the success alert. User asked for "records" saving mainly.
        // I will keep confirm() for now as it's a decision, not just info.
        if (confirm("Confirm upgrade to Pro Plan ($9.99/mo)?")) {
            await updateUserProfile({ subscription_tier: 'pro' });
            toast.success("Welcome to Pro!");
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-2xl mx-auto">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Account</h1>
                <p className="text-muted-foreground">Manage your profile and subscription.</p>
            </div>

            {/* Profile Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Update your personal details.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSave}>
                    <CardContent className="space-y-4">
                        {success && <div className="text-sm text-green-500 bg-green-500/10 p-2 rounded">{success}</div>}

                        <div className="flex flex-col items-center gap-4 mb-6">
                            <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-upload')?.click()}>
                                <Avatar className="h-24 w-24 border-2 border-border group-hover:border-primary transition-colors">
                                    <AvatarImage src={userProfile.photoURL || undefined} className="object-cover" />
                                    <AvatarFallback className="text-2xl">{firstName ? firstName[0].toUpperCase() : "U"}</AvatarFallback>
                                </Avatar>
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="h-8 w-8 text-white" />
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">Click to change avatar</p>
                            <input
                                id="avatar-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarChange}
                                disabled={uploading}
                            />
                            {uploading && <p className="text-xs text-primary animate-pulse">Uploading...</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" /> First Name
                                </label>
                                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First Name" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" /> Last Name
                                </label>
                                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last Name" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" /> Email
                            </label>
                            {/* Email is typically read-only or handled via separate auth flow */}
                            <Input value={user?.email || ""} disabled className="bg-muted" />
                            <p className="text-xs text-muted-foreground">Email cannot be changed directly.</p>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : "Save Changes"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            {/* Subscription */}
            <Card className={userProfile.subscription_tier === 'pro' ? "border-primary/50 bg-primary/5" : ""}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {userProfile.subscription_tier === 'pro' ? <Crown className="h-5 w-5 text-yellow-500" /> : <Shield className="h-5 w-5" />}
                        Subscription Plan
                    </CardTitle>
                    <CardDescription>
                        You are currently on the <span className="font-bold uppercase">{userProfile.subscription_tier || 'Free'}</span> plan.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground">
                        {userProfile.subscription_tier === 'pro'
                            ? "Thank you for being a Pro member! You have access to all advanced features."
                            : "Upgrade to Pro to unlock advanced analytics, unlimited history, and priority support."}
                    </div>
                </CardContent>
                <CardFooter>
                    {userProfile.subscription_tier !== 'pro' && (
                        <Button onClick={handleUpgrade} className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0">
                            Upgrade to Pro ($9.99)
                        </Button>
                    )}
                    {userProfile.subscription_tier === 'pro' && (
                        <Button variant="outline" onClick={() => updateUserProfile({ subscription_tier: 'free' })}>
                            Manage Subscription
                        </Button>
                    )}
                </CardFooter>
            </Card>

            {/* Notification Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notification Settings
                    </CardTitle>
                    <CardDescription>
                        Manage how you receive updates and alerts.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between space-x-2">
                        <div className="flex flex-col space-y-1">
                            <span className="text-sm font-medium leading-none">Push Notifications</span>
                            <span className="text-xs text-muted-foreground">
                                Receive updates on your device.
                            </span>
                        </div>
                        <Switch
                            checked={pushEnabled}
                            onCheckedChange={() => {
                                if (!pushEnabled) enablePush();
                            }}
                            disabled={pushEnabled} // Can usually only disable via browser settings once granted
                        />
                    </div>
                    {pushEnabled && (
                        <p className="text-xs text-muted-foreground">
                            * To disable notifications, please reset permissions in your browser settings.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div >
    );
}
