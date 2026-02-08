import { Link, Outlet, useLocation } from "react-router-dom";
import { Menu, Settings as SettingsIcon, LogOut, Sun, Moon, ChevronsUpDown, LifeBuoy, Laptop, Shield, PanelLeft, PanelLeftClose, ChevronDown, ChevronRight, Plus, Globe, User, CreditCard, BadgeDollarSign, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/AuthContext";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { isSameDay, parseISO, format } from "date-fns";
import { cn } from "@/lib/utils";
import { useData } from "@/features/data/DataContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
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
    const { userProfile, mindsetLogs, collaborations, isLoading } = useData();
    const { logout, user } = useAuth();
    const { setTheme } = useTheme();
    const [installModalOpen, setInstallModalOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const isMindsetLoggedToday = mindsetLogs.some(log => isSameDay(parseISO(log.date), new Date()));
    const [expandedItems, setExpandedItems] = useState<string[]>(["/workouts"]); // Default expand workous
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentDate(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Get accepted friends for sidebar
    const acceptedFriends = collaborations.filter(c => c.status === 'accepted');
    // Show max 3 friends + user
    const displayFriends = acceptedFriends.slice(0, 3);
    const remainingFriends = acceptedFriends.length - displayFriends.length;

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
    const { todos, updateToDo } = useData();

    // Poll for Task Notifications
    useEffect(() => {
        if (!user) return;

        const checkTasks = async () => {
            const now = new Date();
            const dueTasks = todos.filter(t => {
                // @ts-ignore
                if (t.notification_sent || t.completed || !t.notify) return false;
                if (!t.due_date) return false;

                const dueDate = parseISO(t.due_date);
                if (!isSameDay(dueDate, now)) return false;

                if (!t.due_time) return false;

                // Check time match (simple minute precision)
                const [hours, minutes] = t.due_time.split(':').map(Number);
                const dueDateTime = new Date(dueDate);
                dueDateTime.setHours(hours, minutes, 0, 0);

                // Calculate notification time
                let notifyTime = new Date(dueDateTime);
                if (t.notify_before === '1_hour') notifyTime.setHours(notifyTime.getHours() - 1);
                else if (t.notify_before === '1_day') notifyTime.setDate(notifyTime.getDate() - 1);
                else notifyTime.setMinutes(notifyTime.getMinutes() - 10); // Default 10 min

                // Check if we are past the notify time (and within reasonable window, e.g., last 15 mins to avoid old alarms)
                const diff = (now.getTime() - notifyTime.getTime()) / 1000 / 60; // diff in minutes
                return diff >= 0 && diff < 15;
            });

            for (const task of dueTasks) {
                // 1. Insert Notification (triggering bell/system)
                await supabase.from('notifications').insert({
                    user_id: user.id,
                    title: "Task Reminder",
                    message: `Reminder: ${task.title} is coming up!`,
                    type: 'info'
                });

                // 2. Mark task as notified
                // @ts-ignore
                await updateToDo(task.id, { notification_sent: true });
            }
        };

        const interval = setInterval(checkTasks, 60000); // Check every minute
        checkTasks(); // Run immediately

        return () => clearInterval(interval);
    }, [user, todos, updateToDo]);

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
    const { appLogo, socialUrl, appFavicon } = useData();
    // Prevent default logo flash: only show default if explicitly loaded as such or if we want a hard fallback. 
    // Better: Allow null/empty to show skeleton or nothing.
    const logoUrl = appLogo;
    const faviconUrl = appFavicon || '/favicon.ico';

    useEffect(() => {
        const link = (document.querySelector("link[rel*='icon']") || document.createElement('link')) as HTMLLinkElement;
        link.type = 'image/x-icon';
        link.rel = 'icon';
        link.href = faviconUrl;
        document.getElementsByTagName('head')[0].appendChild(link);
    }, [faviconUrl]);

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
                    <Link to="/dashboard">
                        {logoUrl ? (
                            <img src={logoUrl} alt="Logo" className="h-8 object-contain" fetchPriority="high" />
                        ) : (
                            // Show nothing or a spacer while loading to prevent default flash
                            <div className="h-8 w-8"></div>
                        )}
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
                            {logoUrl ? (
                                <img src={logoUrl} alt="Logo" className="h-8 object-contain object-left transition-all" fetchPriority="high" />
                            ) : (
                                <div className="h-8 w-8"></div>
                            )}
                        </Link>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("hidden md:flex h-8 w-8 ml-auto", isCollapsed && "ml-0")}
                        onClick={() => setIsCollapsed(!isCollapsed)}
                    >
                        {isCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                    </Button>
                </div>
                <div className="flex-1 overflow-y-auto py-4">
                    <nav className="space-y-1 px-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.href;
                            const hasChildren = item.children && item.children.length > 0;
                            const isExpanded = expandedItems.includes(item.href);

                            // Mindset Alert Dot
                            const showMindsetDot = item.href === '/mindset' && !isMindsetLoggedToday;

                            if (hasChildren) {
                                return (
                                    <div key={item.href} className="space-y-1">
                                        <Button
                                            variant={isActive || isExpanded ? "secondary" : "ghost"}
                                            className={cn(
                                                "w-full justify-start relative group",
                                                isActive && "bg-secondary font-medium",
                                                isCollapsed ? "px-2 justify-center" : "px-3"
                                            )}
                                            onClick={(e) => toggleExpand(item.href, e)}
                                        >
                                            <Icon className={cn("h-4 w-4 shrink-0", isCollapsed ? "mr-0" : "mr-3")} />
                                            {!isCollapsed && (
                                                <>
                                                    <span className="flex-1 text-left">{item.label}</span>
                                                    {isExpanded ? <ChevronDown className="h-4 w-4 opacity-50" /> : <ChevronRight className="h-4 w-4 opacity-50" />}
                                                </>
                                            )}
                                        </Button>
                                        {!isCollapsed && isExpanded && (
                                            <div className="pl-9 space-y-1 mt-1 animate-in slide-in-from-top-2 duration-200">
                                                {item.children.map(child => (
                                                    <Link key={child.href} to={child.href}>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className={cn(
                                                                "w-full justify-start h-8 text-sm font-normal text-muted-foreground hover:text-foreground",
                                                                location.pathname === child.href && "bg-secondary text-foreground font-medium"
                                                            )}
                                                        >
                                                            {child.label}
                                                        </Button>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            return (
                                <Link key={item.href} to={item.href}>
                                    <Button
                                        variant={isActive ? "secondary" : "ghost"}
                                        className={cn(
                                            "w-full justify-start relative group mb-1",
                                            isActive && "bg-secondary font-medium",
                                            isCollapsed ? "px-2 justify-center" : "px-3"
                                        )}
                                        title={isCollapsed ? item.label : undefined}
                                    >
                                        <Icon className={cn("h-4 w-4 shrink-0", isCollapsed ? "mr-0" : "mr-3")} />
                                        {!isCollapsed && <span>{item.label}</span>}
                                        {showMindsetDot && (
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                                        )}
                                    </Button>
                                </Link>
                            );
                        })}
                    </nav>

                    {!isCollapsed && (
                        <div className="mt-8 px-4">
                            <h3 className="text-xs font-semibold text-muted-foreground tracking-wider mb-2 uppercase">My Team</h3>
                            <div className="space-y-4">
                                <Link to="/collaboration" className="block p-3 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 hover:border-indigo-500/40 transition-all group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 bg-primary text-white text-[9px] px-1.5 py-0.5 rounded-bl-lg font-bold tracking-wider z-20">PRO</div>
                                    <div className="flex items-center gap-3 relative z-10">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                                            <User className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-sm group-hover:text-indigo-500 transition-colors">invite Partner</div>
                                            <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">Share workouts & track progress together</div>
                                        </div>
                                    </div>
                                </Link>

                                {displayFriends.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground px-1">
                                            <span>ACTIVE PARTNERS</span>
                                            <Link to="/collaboration" className="hover:text-primary transition-colors">View All</Link>
                                        </div>
                                        {displayFriends.map(friend => (
                                            <Link key={friend.id} to={`/collaboration`} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors group">
                                                <div className="relative">
                                                    <Avatar className="h-8 w-8 border-2 border-background group-hover:border-primary/20 transition-colors">
                                                        <AvatarImage src={friend.friend?.photoURL} />
                                                        <AvatarFallback>{getInitials(friend.friend?.displayName)}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-medium truncate">{friend.friend?.displayName}</div>
                                                    <div className="text-[10px] text-muted-foreground truncate">Online now</div>
                                                </div>
                                            </Link>
                                        ))}
                                        {remainingFriends > 0 && (
                                            <Link to="/collaboration" className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors text-xs text-muted-foreground">
                                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium border-2 border-background">
                                                    +{remainingFriends}
                                                </div>
                                                <span>more partners...</span>
                                            </Link>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* User Profile Footer (Desktop) */}
                <div className={cn("border-t p-4 shrink-0", isCollapsed ? "px-2" : "px-4")}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className={cn("w-full transition-all hover:bg-muted/60 h-auto py-2", isCollapsed ? "justify-center px-0" : "justify-start px-2")}>
                                <div className="flex items-center gap-3 w-full">
                                    <Avatar className="h-9 w-9 border shrink-0">
                                        <AvatarImage src={userProfile.photoURL} />
                                        <AvatarFallback>{getInitials(userProfile.displayName)}</AvatarFallback>
                                    </Avatar>
                                    {!isCollapsed && (
                                        <div className="flex flex-col items-start min-w-0 flex-1">
                                            <span className="text-sm font-medium truncate w-full text-left">{userProfile.displayName || 'User'}</span>
                                            <span className="text-xs text-muted-foreground truncate w-full text-left">{userProfile.email}</span>
                                        </div>
                                    )}
                                    {!isCollapsed && <ChevronsUpDown className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />}
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" side="right" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{userProfile.displayName}</p>
                                    <p className="text-xs leading-none text-muted-foreground">{userProfile.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <Link to="/account">
                                <DropdownMenuItem className="cursor-pointer">
                                    <User className="mr-2 h-4 w-4" />
                                    Profile
                                </DropdownMenuItem>
                            </Link>
                            <Link to="/settings">
                                <DropdownMenuItem className="cursor-pointer">
                                    <SettingsIcon className="mr-2 h-4 w-4" />
                                    Settings
                                </DropdownMenuItem>
                            </Link>

                            <DropdownMenuItem className="cursor-pointer" onClick={() => setIsMobileMenuOpen(false)}>
                                <CreditCard className="mr-2 h-4 w-4" />
                                Billing
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                                <BadgeDollarSign className="mr-2 h-4 w-4" />
                                Refer text
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                    <Laptop className="mr-2 h-4 w-4" />
                                    Theme
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

                            {userProfile.role === 'admin' && (
                                <>
                                    <Link to="/manage-users">
                                        <DropdownMenuItem className="cursor-pointer">
                                            <Shield className="mr-2 h-4 w-4" />
                                            Manage Users
                                        </DropdownMenuItem>
                                    </Link>
                                    <DropdownMenuSeparator />
                                </>
                            )}
                            <Link to="/support">
                                <DropdownMenuItem className="cursor-pointer">
                                    <LifeBuoy className="mr-2 h-4 w-4" />
                                    Support
                                </DropdownMenuItem>
                            </Link>
                            {socialUrl && (
                                <a href={socialUrl} target="_blank" rel="noopener noreferrer">
                                    <DropdownMenuItem className="cursor-pointer">
                                        <MessageSquare className="mr-2 h-4 w-4" />
                                        Community
                                    </DropdownMenuItem>
                                </a>
                            )}
                            <DropdownMenuSeparator />

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
                        {format(currentDate, "EEEE, MMMM do, yyyy")}
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

                <div className="flex-1 overflow-y-auto scrollbar-thin">
                    <div className="min-h-full pb-20 md:pb-10">
                        <Outlet />
                    </div>
                </div>
            </main>

            <InstallPrompt
                isOpen={installModalOpen}
                onClose={() => setInstallModalOpen(false)}
            />

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden mt-auto">
                <BottomNav />
            </div>
        </div>
    );
}

