import { Link, Outlet, useLocation } from "react-router-dom";
import { Menu, Dumbbell, Home, Ruler, Trophy, Settings as SettingsIcon, LogOut, Sun, Moon, ChevronsUpDown, LifeBuoy, Laptop, Brain, ListTodo, Shield, PanelLeft, PanelLeftClose, Crown, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/AuthContext";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { isSameDay, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { useData } from "@/features/data/DataContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/theme-provider";
import { BottomNav } from "./BottomNav";
import { NotificationBell } from "@/components/ui/notification-bell";
import { useNotifications } from "@/features/notifications/NotificationContext";
import { InstallPrompt } from "@/components/InstallPrompt";
import { Download } from "lucide-react";

export const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/workouts", label: "Workouts", icon: Dumbbell },
    { href: "/todos", label: "To Do List", icon: ListTodo },
    { href: "/measurements", label: "Measurements", icon: Ruler },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/mindset", label: "Mindset", icon: Brain },
];

export function AppShell() {
    // Force Re-render match
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { userProfile, mindsetLogs } = useData();
    const { logout, user } = useAuth();
    const { setTheme } = useTheme();
    const [installModalOpen, setInstallModalOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const isMindsetLoggedToday = mindsetLogs.some(log => isSameDay(parseISO(log.date), new Date()));

    const handleLogout = async () => {
        await logout();
    };

    const getInitials = (name: string) => {
        if (!name) return "U";
        const parts = name.split(" ");
        if (parts.length > 1) return parts[0][0] + parts[1][0];
        return name[0].toUpperCase();
    };

    const { enablePush } = useNotifications();

    useEffect(() => {
        // Show permission prompt on first load if default
        if ('Notification' in window && Notification.permission === 'default') {
            const timer = setTimeout(() => {
                toast("Enable Notifications", {
                    description: "Stay updated with your latest stats and alerts.",
                    action: {
                        label: "Enable",
                        onClick: () => enablePush(),
                    },
                    cancel: {
                        label: "Later",
                        onClick: () => { },
                    },
                    duration: 10000,
                });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [enablePush]);

    // Legacy LocalStorage logic removed.
    // Use Global DB Setting
    const { appLogo } = useData();
    const logoUrl = appLogo || '/logo.png';

    const [onlineCount, setOnlineCount] = useState(1);

    useEffect(() => {
        const channel = supabase.channel('online-users', {
            config: {
                presence: {
                    key: user?.id,
                },
            },
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                setOnlineCount(Object.keys(state).length);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        user_id: user?.id,
                        online_at: new Date().toISOString(),
                    });
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);



    return (
        <div className="flex h-screen w-full overflow-hidden flex-col md:flex-row">
            {/* Mobile Header */}
            <div className="flex items-center justify-between border-b p-4 md:hidden shrink-0">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="-ml-2">
                        <Menu className="h-6 w-6" />
                    </Button>
                    <img src={logoUrl} alt="Logo" className="h-8 object-contain" />
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-2.5 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium flex items-center gap-1.5 border border-primary/20 h-7">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        {onlineCount}
                    </div>
                    <NotificationBell />
                </div>
            </div>

            {/* Mobile Sidebar Backdrop */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-[55] bg-black/50 md:hidden animate-in fade-in-0"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar (Desktop) */}
            <aside className={cn(
                "fixed inset-y-0 z-[60] flex flex-col border-r bg-background transition-all duration-300 md:relative md:translate-x-0",
                isMobileMenuOpen ? "translate-x-0 w-56" : "-translate-x-full md:translate-x-0",
                isCollapsed ? "md:w-20" : "md:w-56"
            )}>
                <div className={cn("flex h-16 items-center border-b px-4 shrink-0 transition-all", isCollapsed ? "justify-center" : "justify-between")}>
                    {!isCollapsed && (
                        <img src={logoUrl} alt="Logo" className="h-8 object-contain object-left transition-all" />
                    )}

                    {/* Toggle Button (Desktop Only) */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("hidden md:flex text-muted-foreground", isCollapsed ? "" : "ml-auto")}
                        onClick={() => setIsCollapsed(!isCollapsed)}
                    >
                        {isCollapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                    </Button>
                </div>

                <nav className="flex-1 space-y-1 p-2 overflow-y-auto overflow-x-hidden">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            to={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={cn(
                                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground relative transition-all group",
                                location.pathname === item.href ? "bg-accent/50 text-accent-foreground" : "text-muted-foreground",
                                isCollapsed ? "justify-center px-0 w-10 h-10 mx-auto" : ""
                            )}
                            title={isCollapsed ? item.label : undefined}
                        >
                            <div className="relative shrink-0 flex items-center justify-center">
                                <item.icon className={cn("h-5 w-5 transition-all", isCollapsed ? "h-6 w-6" : "")} />
                                {item.label === "Mindset" && !isMindsetLoggedToday && (
                                    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-background" />
                                )}
                            </div>
                            {!isCollapsed && (
                                <span className="truncate transition-all duration-300 opacity-100">{item.label}</span>
                            )}
                        </Link>
                    ))}
                </nav>

                <div className={cn("px-4 py-2 mt-auto mb-2", isCollapsed ? "flex justify-center px-0" : "")}>
                    {!isCollapsed && (
                        <h4 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Integrations
                        </h4>
                    )}
                    <Button
                        variant="ghost"
                        className={cn(
                            "w-full px-3 font-normal hover:bg-orange-500/10 hover:text-orange-600 transition-colors",
                            isCollapsed ? "justify-center px-0 w-10 h-10 rounded-full" : "justify-start gap-3"
                        )}
                        onClick={() => toast.info("Strava integration coming soon!")}
                        title={isCollapsed ? "Sync with Strava" : undefined}
                    >
                        {isCollapsed ? (
                            <Activity className="h-5 w-5 text-orange-600" />
                        ) : (
                            <>
                                <img src="/strava.png" alt="Strava" className="h-5 w-5 object-contain" />
                                Sync with Strava
                            </>
                        )}
                    </Button>
                </div>

                <div className={cn("border-t shrink-0 flex flex-col gap-2", isCollapsed ? "p-2 items-center" : "p-4")}>
                    {isCollapsed ? (
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-primary/10 text-primary" asChild title="Manage Subscription">
                            <Link to="/account" onClick={() => setIsMobileMenuOpen(false)}>
                                <Crown className="h-5 w-5" />
                            </Link>
                        </Button>
                    ) : (
                        userProfile.subscription_tier === 'free_user' ? (
                            <div className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white">
                                <h3 className="font-semibold">Upgrade to Pro</h3>
                                <p className="mt-1 text-xs text-white/90">Get unlimited access to all features.</p>
                                <Button size="sm" variant="secondary" className="mt-4 w-full" asChild>
                                    <Link to="/account" onClick={() => setIsMobileMenuOpen(false)}>Upgrade Now</Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="rounded-lg bg-secondary/50 p-4">
                                <h3 className="font-semibold text-sm">Subscription Active</h3>
                                <p className="mt-1 text-xs text-muted-foreground">You are on the {userProfile.subscription_tier} plan.</p>
                                <Button size="sm" variant="outline" className="mt-4 w-full" asChild>
                                    <Link to="/account" onClick={() => setIsMobileMenuOpen(false)}>Manage Subscription</Link>
                                </Button>
                            </div>
                        )
                    )}

                    {/* User Menu Dropdown (Bottom) */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className={cn(
                                "w-full h-auto p-2 flex items-center hover:bg-muted/50 rounded-lg group transition-all",
                                isCollapsed ? "justify-center w-10 h-10 rounded-full p-0" : "justify-between"
                            )}>
                                <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
                                    <Avatar className="h-9 w-9 border border-border shrink-0">
                                        <AvatarImage src={userProfile.photoURL} className="object-cover" />
                                        <AvatarFallback>{getInitials(userProfile.displayName)}</AvatarFallback>
                                    </Avatar>
                                    {!isCollapsed && (
                                        <div className="flex flex-col items-start overflow-hidden text-left transition-all duration-300">
                                            <span className="text-sm font-medium truncate max-w-[100px]">{userProfile.displayName || "User"}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {userProfile.subscription_tier === "admin" ? "Admin" :
                                                    userProfile.subscription_tier === "pro" ? "Pro Plan" : "Free Plan"}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                {!isCollapsed && (
                                    <ChevronsUpDown className="h-4 w-4 text-muted-foreground opacity-50 group-hover:opacity-100" />
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-60 mb-2 z-[70]" align="start" side="right" sideOffset={10}>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{userProfile.displayName || "User"}</p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {userProfile.subscription_tier === "admin" ? "Admin User" :
                                            userProfile.subscription_tier === "pro" ? "Pro Member" : "Free User"}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            <DropdownMenuItem asChild>
                                <Link to="/account" onClick={() => setIsMobileMenuOpen(false)} className="cursor-pointer w-full flex items-center">
                                    <SettingsIcon className="mr-2 h-4 w-4" />
                                    Account
                                </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild>
                                <Link to="/account" onClick={() => setIsMobileMenuOpen(false)} className="cursor-pointer w-full flex items-center">
                                    <SettingsIcon className="mr-2 h-4 w-4" />
                                    Billing
                                </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild>
                                <Link to="/settings" onClick={() => setIsMobileMenuOpen(false)} className="cursor-pointer w-full flex items-center">
                                    <SettingsIcon className="mr-2 h-4 w-4" />
                                    Settings
                                </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild>
                                <Link to="/support" onClick={() => setIsMobileMenuOpen(false)} className="cursor-pointer w-full flex items-center">
                                    <LifeBuoy className="mr-2 h-4 w-4" />
                                    Support
                                </Link>
                            </DropdownMenuItem>


                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                    <Sun className="mr-2 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                    <Moon className="absolute mr-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                    <span className="ml-2">Theme</span>
                                </DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                    <DropdownMenuSubContent>
                                        <DropdownMenuItem onClick={() => setTheme("light")}>
                                            <Sun className="mr-2 h-4 w-4" />
                                            Light
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setTheme("dark")}>
                                            <Moon className="mr-2 h-4 w-4" />
                                            Dark
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setTheme("system")}>
                                            <Laptop className="mr-2 h-4 w-4" />
                                            System
                                        </DropdownMenuItem>
                                    </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                            </DropdownMenuSub>

                            <DropdownMenuSeparator />

                            {userProfile.subscription_tier === 'admin' && (
                                <>
                                    <DropdownMenuItem asChild>
                                        <Link to="/admin/users" onClick={() => setIsMobileMenuOpen(false)} className="cursor-pointer w-full flex items-center text-indigo-500 focus:text-indigo-500 font-medium">
                                            <Shield className="mr-2 h-4 w-4" />
                                            Manage Users
                                        </Link>
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />
                                </>
                            )}

                            <DropdownMenuItem onClick={() => setInstallModalOpen(true)} className="cursor-pointer">
                                <Download className="mr-2 h-4 w-4" />
                                Install App
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500 cursor-pointer">
                                <LogOut className="mr-2 h-4 w-4" />
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 bg-muted/20 flex flex-col min-h-0 overflow-hidden">
                {/* Desktop Sticky Header - Simplified */}
                <header className="hidden md:flex items-center justify-between px-6 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0 z-20">
                    <div className="font-medium text-sm text-muted-foreground">
                        Dashboard
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium flex items-center gap-2 border border-primary/20">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                            {onlineCount} Online
                        </div>
                        <NotificationBell />
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
                    <Outlet />
                </div>
                <BottomNav />
            </main>

            <InstallPrompt open={installModalOpen} onOpenChange={setInstallModalOpen} />
        </div>
    );
}
