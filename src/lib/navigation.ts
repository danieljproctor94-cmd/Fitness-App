import { Home, Dumbbell, Calendar, Ruler, Trophy, Users } from "lucide-react";

export interface NavItem {
    href: string;
    label: string;
    icon: any;
    children?: NavItem[];
}

export const navItems: NavItem[] = [
    { href: "/", label: "Home", icon: Home },
    {
        href: "/workouts",
        label: "Workouts",
        icon: Dumbbell
    },
    { href: "/measurements", label: "Measurements", icon: Ruler },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/todos", label: "Planner", icon: Calendar },
    { href: "/collaboration", label: "Collaboration", icon: Users },
];
