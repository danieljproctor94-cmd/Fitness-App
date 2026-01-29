import { Link, Outlet, useLocation } from "react-router-dom";
import { Menu, Dumbbell, LayoutDashboard, Ruler, Trophy, Settings as SettingsIcon, LogOut, Sun, Moon, ChevronsUpDown, LifeBuoy, Laptop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/AuthContext";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useData } from "@/features/data/DataContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/theme-provider";

const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/workouts", label: "Workouts", icon: Dumbbell },
    { href: "/measurements", label: "Measurements", icon: Ruler },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/support", label: "Support", icon: LifeBuoy },
];

export function AppShell() {
    // Force Re-render match
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { userProfile } = useData();
    const { logout } = useAuth();
    const { setTheme } = useTheme();

    const handleLogout = async () => {
        await logout();
    };

    const getInitials = (name: string) => {
        if (!name) return "U";
        const parts = name.split(" ");
        if (parts.length > 1) return parts[0][0] + parts[1][0];
        return name[0].toUpperCase();
    };

    const [logoUrl, setLogoUrl] = useState(localStorage.getItem('app_logo') || '/logo.png');

    useEffect(() => {
        const handleLogoUpdate = () => {
            setLogoUrl(localStorage.getItem('app_logo') || '/logo.png');
        };
        window.addEventListener('logo-update', handleLogoUpdate);
        window.addEventListener('storage', handleLogoUpdate);
        return () => {
            window.removeEventListener('logo-update', handleLogoUpdate);
            window.removeEventListener('storage', handleLogoUpdate);
        };
    }, []);

    const [onlineCount, setOnlineCount] = useState(Math.floor(Math.random() * 5) + 2);

    useEffect(() => {
        const interval = setInterval(() => {
            setOnlineCount(prev => {
                const change = Math.random() > 0.5 ? 1 : -1;
                const newValue = prev + change;
                return newValue < 2 ? 2 : newValue;
            });
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex h-screen w-full overflow-hidden flex-col md:flex-row">
            {/* Mobile Header */}
            <div className="flex items-center justify-between border-b p-4 md:hidden shrink-0">
                <img src={logoUrl} alt="Logo" className="h-12 object-contain" />
                <div className="flex items-center gap-3">
                    <div className="px-2.5 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium flex items-center gap-1.5 border border-primary/20 h-7">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        {onlineCount}
                    </div>
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={userProfile.photoURL} className="object-cover" />
                        <AvatarFallback>{getInitials(userProfile.displayName)}</AvatarFallback>
                    </Avatar>
                    <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                        <Menu className="h-6 w-6" />
                    </Button>
                </div>
            </div>

            {/* Mobile Sidebar Backdrop */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 md:hidden animate-in fade-in-0"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar (Desktop) */}
            <aside className={cn(
                "fixed inset-y-0 z-50 flex w-64 flex-col border-r bg-background transition-transform md:relative md:translate-x-0",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                <div className="flex h-16 items-center justify-start border-b p-4 overflow-hidden shrink-0">
                    <img src={logoUrl} alt="Logo" className="h-full w-full object-contain object-left" />
                </div>

                <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                                location.pathname === item.href ? "bg-accent/50 text-accent-foreground" : "text-muted-foreground"
                            )}
                        >
                            <item.icon className="mr-3 h-5 w-5" />
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="px-4 py-2 mt-auto mb-2">
                    <h4 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Integrations
                    </h4>
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 px-3 font-normal hover:bg-orange-500/10 hover:text-orange-600 transition-colors"
                        onClick={() => toast.info("Strava integration coming soon!")}
                    >
                        <img src="/strava.png" alt="Strava" className="h-5 w-5 object-contain" />
                        Sync with Strava
                    </Button>
                </div>

                <div className="border-t p-4 shrink-0">
                    {userProfile.subscription_tier === 'free_user' ? (
                        <div className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white">
                            <h3 className="font-semibold">Upgrade to Pro</h3>
                            <p className="mt-1 text-xs text-white/90">Get unlimited access to all features.</p>
                            <Button size="sm" variant="secondary" className="mt-4 w-full" asChild>
                                <Link to="/account">Upgrade Now</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="rounded-lg bg-secondary/50 p-4">
                            <h3 className="font-semibold text-sm">Subscription Active</h3>
                            <p className="mt-1 text-xs text-muted-foreground">You are on the {userProfile.subscription_tier} plan.</p>
                            <Button size="sm" variant="outline" className="mt-4 w-full" asChild>
                                <Link to="/account">Manage Subscription</Link>
                            </Button>
                        </div>
                    )}

                    {/* User Menu Dropdown (Bottom) */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="w-full h-auto p-2 flex items-center justify-between hover:bg-muted/50 rounded-lg group">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9 border border-border">
                                        <AvatarImage src={userProfile.photoURL} className="object-cover" />
                                        <AvatarFallback>{getInitials(userProfile.displayName)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col items-start overflow-hidden text-left">
                                        <span className="text-sm font-medium truncate max-w-[100px]">{userProfile.displayName || "User"}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {userProfile.subscription_tier === "admin" ? "Admin" :
                                                userProfile.subscription_tier === "pro" ? "Pro Plan" : "Free Plan"}
                                        </span>
                                    </div>
                                </div>
                                <ChevronsUpDown className="h-4 w-4 text-muted-foreground opacity-50 group-hover:opacity-100" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-60 mb-2" align="start" side="right" sideOffset={10}>
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
                                <Link to="/account" className="cursor-pointer w-full flex items-center">
                                    <SettingsIcon className="mr-2 h-4 w-4" />
                                    Account
                                </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild>
                                <Link to="/account" className="cursor-pointer w-full flex items-center">
                                    <SettingsIcon className="mr-2 h-4 w-4" />
                                    Billing
                                </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild>
                                <Link to="/settings" className="cursor-pointer w-full flex items-center">
                                    <SettingsIcon className="mr-2 h-4 w-4" />
                                    Settings
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
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
