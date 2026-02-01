import { Home, Dumbbell, Calendar, Ruler, Trophy, Brain, BarChart3, Users } from "lucide-react";

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
        icon: Dumbbell,
        children: [
            { href: "/workouts/analytics", label: "Analytics", icon: BarChart3 }
        ]
    },
    { href: "/measurements", label: "Measurements", icon: Ruler },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/todos", label: "Planner", icon: Calendar },
    { href: "/mindset", label: "Mindset", icon: Brain },
    { href: "/collaboration", label: "Collaboration", icon: Users },
];
