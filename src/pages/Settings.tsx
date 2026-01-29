import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bell, Moon, Globe, Sparkles } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useData } from "@/features/data/DataContext";

export default function Settings() {
    // Theme
    const { setTheme, theme } = useTheme();
    const { userProfile } = useData();

    // Mock Settings State
    const [notifications, setNotifications] = useState(true);
    const [marketingEmails, setMarketingEmails] = useState(false);
    const [publicProfile, setPublicProfile] = useState(false);
    const [units, setUnits] = useState('metric'); // metric | imperial

    // Admin Settings
    const [adminLogoUrl, setAdminLogoUrl] = useState(localStorage.getItem('app_logo') || '/logo.png');

    const handleSaveLogo = () => {
        localStorage.setItem('app_logo', adminLogoUrl);
        // Dispatch event so AppShell updates immediately
        window.dispatchEvent(new Event('logo-update'));
        toast.success("Logo updated!");
    };

    return (
        <div className="p-6 space-y-6 max-w-2xl mx-auto">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your app preferences.</p>
                <p className="text-xs text-red-500">
                    DEBUG: Role = {userProfile.subscription_tier || "undefined"}
                    <br />
                    (If this is not 'admin', the logo settings won't show)
                </p>
            </div>

            {/* Admin Settings - Logo */}
            {userProfile.subscription_tier === 'admin' && (
                <Card className="border-indigo-500/50 bg-indigo-500/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-indigo-500" /> Admin Settings
                        </CardTitle>
                        <CardDescription>Configure global application settings.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Dashboard Logo URL</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={adminLogoUrl}
                                    onChange={(e) => setAdminLogoUrl(e.target.value)}
                                    placeholder="/logo.png"
                                />
                                <Button onClick={handleSaveLogo}>Save</Button>
                            </div>

                            <div className="flex items-center gap-2">
                                <p className="text-sm text-muted-foreground">OR</p>
                            </div>

                            <div className="flex gap-2">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    className="cursor-pointer"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                setAdminLogoUrl(reader.result as string);
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                            </div>

                            <p className="text-xs text-muted-foreground">
                                Enter a URL or upload an image from your device.
                                <br />Note: Uploaded images are saved locally to your browser.
                            </p>
                        </div>
                        {adminLogoUrl && (
                            <div className="p-4 border rounded-lg bg-background/50 flex justify-center">
                                <img src={adminLogoUrl} alt="Preview" className="h-12 object-contain" />
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Appearance */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Moon className="h-5 w-5" /> Appearance
                    </CardTitle>
                    <CardDescription>Customize how the app looks on your device.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Dark Mode</Label>
                            <p className="text-sm text-muted-foreground">Enable dark mode for the interface.</p>
                        </div>
                        <Switch
                            checked={theme === 'dark'}
                            onCheckedChange={(c) => setTheme(c ? 'dark' : 'light')}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" /> Notifications
                    </CardTitle>
                    <CardDescription>Configure how you receive alerts.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Push Notifications</Label>
                            <p className="text-sm text-muted-foreground">Receive daily workout reminders.</p>
                        </div>
                        <Switch
                            checked={notifications}
                            onCheckedChange={setNotifications}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Marketing Emails</Label>
                            <p className="text-sm text-muted-foreground">Receive news and offers.</p>
                        </div>
                        <Switch
                            checked={marketingEmails}
                            onCheckedChange={setMarketingEmails}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Preferences */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" /> Preferences
                    </CardTitle>
                    <CardDescription>Set your regional and data preferences.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Use Metric Units (kg/cm)</Label>
                            <p className="text-sm text-muted-foreground">Toggle off for Imperial (lbs/in).</p>
                        </div>
                        <Switch
                            checked={units === 'metric'}
                            onCheckedChange={(c) => setUnits(c ? 'metric' : 'imperial')}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Public Profile</Label>
                            <p className="text-sm text-muted-foreground">Allow others to see your stats.</p>
                        </div>
                        <Switch
                            checked={publicProfile}
                            onCheckedChange={setPublicProfile}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
