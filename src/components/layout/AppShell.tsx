import { Link, Outlet, useLocation } from "react-router-dom";
import { Menu, Settings as SettingsIcon, LogOut, Sun, Moon, ChevronsUpDown, LifeBuoy, Laptop, Shield, PanelLeft, PanelLeftClose, Activity, ChevronDown, ChevronRight, Plus } from "lucide-react";
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
import { navItems } from "@/lib/navigation";
import { BottomNav } from "./BottomNav";
import { NotificationBell } from "@/components/ui/notification-bell";
import { useNotifications } from "@/features/notifications/NotificationContext";
import { InstallPrompt } from "@/components/InstallPrompt";
import { Download } from "lucide-react";

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
    const [expandedItems, setExpandedItems] = useState<string[]>(["/workouts"]); // Default expand workous

    const toggleExpand = (href: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setExpandedItems(prev =>
            prev.includes(href) ? prev.filter(h => h !== href) : [...prev, href]
        );
    };

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
                    <Link to="/">
                        <img src={logoUrl} alt="Logo" className="h-8 object-contain" />
                    </Link>
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
                        <Link to="/">
                            <img src={logoUrl} alt="Logo" className="h-8 object-contain object-left transition-all" />
                        </Link>
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
                    {navItems.map((item) => {
                        const isExpanded = expandedItems.includes(item.href);
                        const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
                        const hasChildren = item.children && item.children.length > 0;

                        return (
                            <div key={item.href} className="space-y-1">
                                {item.label === "Collaboration" && !isCollapsed ? (
                                    <div className="mx-2 mt-6 mb-2">
                                        <div className="rounded-xl border border-border/50 bg-card/50 p-3 shadow-sm bg-gradient-to-br from-background to-muted/30 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[9px] px-1.5 py-0.5 rounded-bl-lg font-bold tracking-wider z-20">PRO</div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="flex -space-x-2.5">
                                                    <Avatar className="h-8 w-8 border-2 border-background ring-1 ring-border/10">
                                                        <AvatarImage src={userProfile.photoURL} className="object-cover" />
                                                        <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
                                                            {getInitials(userProfile.displayName)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <button className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-background bg-muted hover:bg-muted/80 transition-colors z-10 ring-1 ring-border/10">
                                                        <Plus className="h-4 w-4 text-muted-foreground" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-semibold text-foreground/80">My Team</span>
                                                <Link to="/collaboration" className="text-xs text-primary hover:text-primary/80 font-medium bg-primary/10 px-2 py-0.5 rounded-full transition-colors">
                                                    Invite
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div
                                            className={cn(
                                                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all group select-none cursor-pointer",
                                                isActive && !hasChildren ? "bg-accent/50 text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                                                isCollapsed ? "justify-center px-0 w-10 h-10 mx-auto" : ""
                                            )}
                                            title={isCollapsed ? item.label : undefined}
                                        >
                                            <Link
                                                to={item.href}
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className={cn("flex items-center gap-3 flex-1", isCollapsed && "justify-center")}
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

                                            {/* Expand/Collapse Chevron for parents */}
                                            {!isCollapsed && hasChildren && (
                                                <button
                                                    onClick={(e) => toggleExpand(item.href, e)}
                                                    className="p-1 rounded-sm hover:bg-accent/50 text-muted-foreground"
                                                >
                                                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                </button>
                                            )}
                                        </div>

                                        {/* Children */}
                                        {!isCollapsed && hasChildren && isExpanded && (
                                            <div className="ml-9 space-y-1 border-l pl-2 border-border/50">
                                                {item.children!.map((child) => (
                                                    <Link
                                                        key={child.href}
                                                        to={child.href}
                                                        onClick={() => setIsMobileMenuOpen(false)}
                                                        className={cn(
                                                            "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all group",
                                                            location.pathname === child.href ? "bg-accent/50 text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                                        )}
                                                    >
                                                        {child.icon && <child.icon className="h-4 w-4 opacity-70" />}
                                                        <span className="truncate">{child.label}</span>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })}
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
                        <DropdownMenuContent className="w-56 mb-2 z-[70]" align="start" side={isCollapsed ? "right" : "top"} sideOffset={10}>
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
