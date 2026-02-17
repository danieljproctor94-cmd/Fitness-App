import { Home, Dumbbell, Calendar, Ruler, Trophy, Users, Brain, Target } from "lucide-react";

export interface NavItem {
    href: string;
    label: string;
    icon: any;
    children?: NavItem[];
}

export const navItems: NavItem[] = [
    { href: "/dashboard", label: "Home", icon: Home },
    {
        href: "/workouts",
        label: "Workouts",
        icon: Dumbbell
    },
    { href: "/measurements", label: "Measurements", icon: Ruler },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
        { href: "/goals", label: "Goals", icon: Target },
    { href: "/planner", label: "Planner", icon: Calendar },
    { href: "/mindset", label: "Mindset", icon: Brain },
    { href: "/collaboration", label: "Collaboration", icon: Users },
];


