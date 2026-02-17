
import {
    BarChart3,
    Users,
    Brain,
    Calendar,
    Zap,
    Shield,
    Check
} from "lucide-react";

export const siteContent = {
    seo: {
        title: "Progress Syncer",
        description: "Track your workouts, habits, and body measurements.",
        keywords: "fitness, tracker",
        ogImage: "/og-image.jpg",
        twitterHandle: "@progresssyncer"
    },
    navbar: {
        brand: "Progress Syncer",
        links: [
            { label: "Features", href: "#features" },
            { label: "How it Works", href: "#how-it-works" },
            { label: "Pricing", href: "#pricing" }
        ],
        cta: {
            dashboard: "Dashboard",
            login: "Join with Google",
            google: "Join with Google",
            start: "Start for Free"
        },
        badge: "v2.0 is now live"
    },
    hero: {
        badge: "v2.0 is now live",
        title: {
            first: "Grow Your Potential",
            highlight: "on Auto-Pilot"
        },
        description: "Get recommended workouts and track nutrition.",
        buttons: {
            google: "Join with Google",
            start: "Start for Free"
        },
        stats: [
            { icon: Check, label: "Daily Goal", value: "Completed", color: "emerald" },
            { icon: Users, label: "Team Spirit", value: "+12% vs last week", color: "blue" }
        ]
    },
    features: {
        id: "features",
        title: "Features",
        subtitle: "Everything you need.",
        items: [
            { icon: Zap, title: "AI Workouts", description: "Personalized plans." },
            { icon: BarChart3, title: "Analytics", description: "Track progress." },
            { icon: Users, title: "Social", description: "Compete with friends." },
            { icon: Brain, title: "Recommendations", description: "Daily tips." },
            { icon: Calendar, title: "Scheduling", description: "Auto-schedule." },
            { icon: Shield, title: "Privacy", description: "Secure data." }
        ]
    },
    pricing: {
        id: "pricing",
        title: "Pricing",
        subtitle: "Simple plans.",
        plans: [
            {
                name: "Free",
                price: "$0",
                period: "/month",
                description: "Basic access",
                features: ["Tracking", "Community"],
                buttonText: "Get Started Free",
                popular: false
            },
            {
                name: "Pro",
                price: "$12",
                period: "/month",
                description: "Full access",
                features: ["AI Coaching", "Analytics"],
                buttonText: "Start Pro Trial",
                popular: true
            }
        ]
    },
    footer: {
        brand: "Progress Syncer",
        description: "Reach your fitness goals.",
        copyright: "(c) 2026 Progress Syncer. All rights reserved.",
        links: [
            { label: "Privacy Policy", href: "/privacy" },
            { label: "Terms of Service", href: "/terms" },
            { label: "Contact", href: "mailto:support@progresssyncer.com" }
        ]
    }
};
