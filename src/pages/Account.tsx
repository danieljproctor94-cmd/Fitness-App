import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useData } from "@/features/data/DataContext";
import { User, Mail, Shield, Crown } from "lucide-react";

export default function Account() {
    const { userProfile, updateUserProfile } = useData();
    const [name, setName] = useState(userProfile.displayName || "");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");

    useEffect(() => {
        setName(userProfile.displayName || "");
    }, [userProfile]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSuccess("");

        try {
            await updateUserProfile({ displayName: name });
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

                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" /> Full Name
                            </label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Name" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" /> Email
                            </label>
                            {/* Email is typically read-only or handled via separate auth flow */}
                            <Input value="user@example.com" disabled className="bg-muted" />
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
        </div>
    );
}
