import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bell, Moon, Globe, Sparkles, Smartphone } from "lucide-react";
import { useNotifications } from "@/features/notifications/NotificationContext";
import { useTheme } from "@/components/theme-provider";
import { useData } from "@/features/data/DataContext";
import { uploadAvatar } from "@/lib/storage-utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function Settings() {
    // Theme
    const { setTheme, theme } = useTheme();
    const { userProfile } = useData();
    const { pushEnabled, enablePush } = useNotifications();

    // Mock Settings State
    const [notifications, setNotifications] = useState(true);
    const [marketingEmails, setMarketingEmails] = useState(false);
    const [publicProfile, setPublicProfile] = useState(false);
    const [units, setUnits] = useState('metric'); // metric | imperial

    // Admin Settings
    const { updateAppLogo, appLogo, updateSocialUrl, socialUrl, updateAppFavicon, appFavicon } = useData();
    const [adminLogoUrl, setAdminLogoUrl] = useState(appLogo || '');
    const [adminFaviconUrl, setAdminFaviconUrl] = useState(appFavicon || '/favicon.ico');
    const [adminSocialUrl, setAdminSocialUrl] = useState(socialUrl || '');

    // Sync local state with context when context loads
    useEffect(() => {
        if (appLogo) {
            setAdminLogoUrl(appLogo);
        }
        if (socialUrl) {
            setAdminSocialUrl(socialUrl);
        }
        if (appFavicon) {
            setAdminFaviconUrl(appFavicon);
        }
    }, [appLogo, socialUrl, appFavicon]);

    const handleSaveLogo = async () => {
        // localStorage.setItem('app_logo', adminLogoUrl); // Legacy
        // window.dispatchEvent(new Event('logo-update')); // Legacy

        await updateAppLogo(adminLogoUrl);
    };

    const handleSaveSocial = async () => {
        await updateSocialUrl(adminSocialUrl);
    };

    const handleSaveFavicon = async () => {
        await updateAppFavicon(adminFaviconUrl);
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

            {/* PWA Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Smartphone className="h-5 w-5 text-primary" /> Application Info
                    </CardTitle>
                    <CardDescription>PWA and system settings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Push Notifications</Label>
                            <p className="text-xs text-muted-foreground">Receive system notifications for task reminders.</p>
                        </div>
                        <Switch checked={pushEnabled} onCheckedChange={enablePush} />
                    </div>
                    <div className="border-t pt-4">
                        <p className="text-xs text-muted-foreground">Version: 1.2.0 (Stable)</p>
                        <p className="text-xs text-muted-foreground">Platform: {navigator.userAgent.includes("Android") ? "Android PWA" : navigator.userAgent.includes("iPhone") ? "iOS PWA" : "Desktop Web"}</p>
                    </div>
                </CardContent>
            </Card>

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
                                    placeholder="https://example.com/logo.png"
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
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file && userProfile.id) {
                                            toast.info("Uploading logo...");
                                            const { url: publicUrl, error } = await uploadAvatar(file, userProfile.id);
                                            if (publicUrl) {
                                                setAdminLogoUrl(publicUrl);
                                                // Auto-save
                                                await updateAppLogo(publicUrl);
                                                toast.success("Logo updated successfully!");
                                            } else {
                                                console.error("Upload failed:", error);
                                                toast.error(`Upload failed: ${error?.message || "Unknown error"}`);
                                            }
                                        }
                                    }}
                                />
                            </div>

                            <p className="text-xs text-muted-foreground">
                                Enter a URL or upload an image.
                                <br />Images are stored securely in Supabase.
                            </p>
                        </div>
                        {adminLogoUrl && (
                            <div className="p-4 border rounded-xl bg-background/50 flex justify-center">
                                <img src={adminLogoUrl} alt="Preview" className="h-12 object-contain" />
                            </div>
                        )}

                        <div className="space-y-2 pt-4 border-t border-indigo-500/20">
                            <Label>App Icon / Favicon URL</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={adminFaviconUrl}
                                    onChange={(e) => setAdminFaviconUrl(e.target.value)}
                                    placeholder="/favicon.ico"
                                />
                                <Button onClick={handleSaveFavicon}>Save</Button>
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    type="file"
                                    accept="image/x-icon,image/png,image/svg+xml"
                                    className="cursor-pointer"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file && userProfile.id) {
                                            toast.info("Uploading favicon...");
                                            const { url: publicUrl, error } = await uploadAvatar(file, userProfile.id);
                                            if (publicUrl) {
                                                setAdminFaviconUrl(publicUrl);
                                                // Auto-save
                                                await updateAppFavicon(publicUrl);
                                                toast.success("Favicon updated successfully!");
                                            } else {
                                                console.error("Upload failed:", error);
                                                toast.error(`Upload failed: ${error?.message || "Unknown error"}`);
                                            }
                                        }
                                    }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Upload an icon (ICO, PNG, SVG) for the browser tab.
                            </p>

                            <div className="pt-2">
                                <Label className="text-xs mb-2 block">Icon Preview</Label>
                                {adminFaviconUrl ? (
                                    <div className="p-2 border rounded-xl bg-background/50 inline-flex shadow-sm">
                                        <img src={adminFaviconUrl} alt="Favicon Preview" className="h-16 w-16 object-contain rounded-lg" />
                                    </div>
                                ) : (
                                    <Skeleton className="h-20 w-20 rounded-xl" />
                                )}
                            </div>
                        </div>

                        <div className="space-y-2 pt-4 border-t border-indigo-500/20">
                            <Label>Social Media URL</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={adminSocialUrl}
                                    onChange={(e) => setAdminSocialUrl(e.target.value)}
                                    placeholder="https://instagram.com/your-gym"
                                />
                                <Button onClick={handleSaveSocial}>Save</Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Add a link to your community or social page.
                            </p>
                        </div>

                        {/* AI Config */}
                        <div className="space-y-4 pt-4 border-t border-indigo-500/20">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-pink-500" />
                                <Label className="text-base font-semibold text-foreground">AI Configuration</Label>
                            </div>

                            <div className="space-y-2">
                                <Label>OpenAI API Key</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="password"
                                        placeholder="sk-..."
                                        defaultValue={localStorage.getItem('openai_api_key') || ''}
                                        onChange={(e) => localStorage.setItem('openai_api_key', e.target.value)}
                                        className="font-mono text-xs"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Required for advanced voice analysis. Stored locally on your device.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>Voice AI Prompt (System Instructions)</Label>
                                <textarea
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="You are a helpful assistant..."
                                    defaultValue={localStorage.getItem('voice_ai_prompt') || ''}
                                    onChange={(e) => localStorage.setItem('voice_ai_prompt', e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Customize how the AI interprets your voice commands.
                                </p>
                            </div>
                        </div>
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

