import { useState, useRef } from "react";
import { useData } from "@/features/data/DataContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Save, Camera, Lock, Trash2, Mail, ShieldAlert } from "lucide-react";
// import { Separator } from "@/components/ui/dropdown-menu"; // Unused and potentially incorrect


export default function AccountSettings() {
    const { userProfile, updateUserProfile } = useData();
    const [displayName, setDisplayName] = useState(userProfile.displayName || "");
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSave = () => {
        setIsSaving(true);
        // Simulate network delay
        setTimeout(() => {
            updateUserProfile({ displayName });
            setIsSaving(false);
        }, 500);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                updateUserProfile({ photoURL: base64String });
            };
            reader.readAsDataURL(file);
        }
    };

    const getInitials = (name: string) => {
        if (!name) return "U";
        const parts = name.split(" ");
        if (parts.length > 1) return parts[0][0] + parts[1][0];
        return name[0].toUpperCase();
    };

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-8">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
                <p className="text-muted-foreground">Manage your profile, security, and preferences.</p>
            </div>

            <div className="grid gap-8 md:grid-cols-[1fr_250px] lg:grid-cols-[1fr_300px]">

                <div className="space-y-6">
                    {/* Profile Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>Update your public profile details.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                <div className="relative group cursor-pointer shrink-0" onClick={() => fileInputRef.current?.click()}>
                                    <Avatar className="h-24 w-24 border-2 border-border shadow-sm">
                                        <AvatarImage src={userProfile.photoURL} className="object-cover" />
                                        <AvatarFallback className="text-2xl">{getInitials(displayName)}</AvatarFallback>
                                    </Avatar>
                                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera className="text-white h-6 w-6" />
                                    </div>
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                                <div className="space-y-1 text-center sm:text-left">
                                    <div className="font-medium">Profile Photo</div>
                                    <div className="text-xs text-muted-foreground">Click to upload. JPG, PNG or GIF.</div>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="displayName">Display Name</Label>
                                    <Input
                                        id="displayName"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="Your Name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input id="email" value="user@example.com" disabled className="pl-9 bg-muted" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-end border-t pt-4">
                            <Button onClick={handleSave} disabled={isSaving}>
                                <Save className="mr-2 h-4 w-4" />
                                {isSaving ? "Saving..." : "Save Changes"}
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Security Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lock className="h-5 w-5" />
                                Security
                            </CardTitle>
                            <CardDescription>Manage your password and authentication.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="space-y-0.5">
                                    <div className="font-medium">Password</div>
                                    <div className="text-sm text-muted-foreground">Last changed 3 months ago</div>
                                </div>
                                <Button variant="outline" size="sm">Reset Password</Button>
                            </div>
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="space-y-0.5">
                                    <div className="font-medium">Two-Factor Authentication</div>
                                    <div className="text-sm text-muted-foreground">Add an extra layer of security</div>
                                </div>
                                <Button variant="outline" size="sm" disabled>Enable (Pro)</Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Personal Data Section */}
                    <Card className="border-red-100 dark:border-red-900/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-500">
                                <ShieldAlert className="h-5 w-5" />
                                Danger Zone
                            </CardTitle>
                            <CardDescription>Irreversible actions requiring caution.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <div className="font-medium">Delete Account</div>
                                    <div className="text-sm text-muted-foreground">Permanently remove all data</div>
                                </div>
                                <Button variant="destructive" size="sm">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Account
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Stats Summary (now on the right) */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Physical Profile</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground uppercase">Height</Label>
                                <div className="font-medium text-lg">{userProfile.height ? `${userProfile.height} cm` : "--"}</div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground uppercase">Waist</Label>
                                <div className="font-medium text-lg">{userProfile.waist ? `${userProfile.waist} cm` : "--"}</div>
                            </div>
                            <div className="pt-2">
                                <Button variant="outline" className="w-full" asChild>
                                    <a href="/measurements">Edit Stats</a>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
