
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
        title: "Progress Syncer - Grow Your Potential on Auto-Pilot",
        description: "Track your workouts, habits, and body measurements with Progress Syncer. Your all-in-one fitness companion.",
        keywords: "fitness app, workout tracker, ai fitness, nutrition tracking, social fitness, progress syncer",
        ogImage: "/og-image.jpg", // You needs to create this image in public/
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
            start: "Get Started for Free"
        },
        badge: "v2.0 is now live"
    },
    hero: {
        badge: "v2.0 is now live",
        title: {
            first: "Grow Your Potential",
            highlight: "on Auto-Pilot"
        },
        description: "Get recommended workouts, track nutrition, and compete with friends. All powered by AI to keep you consistent while you sleep.",
        buttons: {
            google: "Join with Google",
            start: "Get Started for Free"
        },
        stats: [
            { icon: Check, label: "Daily Goal", value: "Completed", color: "emerald" },
            { icon: Users, label: "Team Spirit", value: "+12% vs last week", color: "blue" }
        ]
    },
    features: {
        id: "features",
        title: "Everything you need to succeed",
        subtitle: "Powerful features to help you reach your fitness goals faster.",
        items: [
            {
                icon: Zap,
                title: "AI Workout Generation",
                description: "Get personalized workout plans based on your goals and available equipment."
            },
            {
                icon: BarChart3,
                title: "Advanced Analytics",
                description: "Track your progress with detailed charts and insights into your performance."
            },
            {
                icon: Users,
                title: "Social Competition",
                description: "Compete with friends on leaderboards and share your achievements."
            },
            {
                icon: Brain,
                title: "Smart Recommendations",
                description: "Receive daily tips and adjustments to your plan based on your activity."
            },
            {
                icon: Calendar,
                title: "Smart Scheduling",
                description: "Automatically schedule your workouts around your busy life."
            },
            {
                icon: Shield,
                title: "Privacy First",
                description: "Your data is encrypted and secure. We never sell your personal information."
            }
        ]
    },
    pricing: {
        id: "pricing",
        title: "Simple, transparent pricing",
        subtitle: "Start for free, upgrade when you need more power.",
        plans: [
            {
                name: "Free",
                price: "$0",
                period: "/month",
                description: "Perfect for getting started",
                features: [
                    "Basic workout tracking",
                    "Limited AI recommendations",
                    "Community access",
                    "Mobile app access"
                ],
                buttonText: "Get Started Free",
                popular: false
            },
            {
                name: "Pro",
                price: "$12",
                period: "/month",
                description: "For serious fitness enthusiasts",
                features: [
                    "Advanced AI coaching",
                    "Unlimited workout history",
                    "Detailed analytics",
                    "Priority support",
                    "Custom meal plans"
                ],
                buttonText: "Start Pro Trial",
                popular: true
            }
        ]
    },
    footer: {
        brand: "Progress Syncer",
        description: "Empowering you to reach your fitness goals with AI-driven insights and community support.",
        copyright: "© 2026 Progress Syncer. All rights reserved.",
        links: [
            { label: "Privacy Policy", href: "/privacy" }, // You might need to create these pages
            { label: "Terms of Service", href: "/terms" },
            { label: "Contact", href: "mailto:support@progresssyncer.com" }
        ]
    }
};
