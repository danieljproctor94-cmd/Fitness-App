import {
    BarChart3,
    Users,
    Brain,
    Calendar,
    Zap,
    
    Dumbbell,
    Activity,
    Target,
    
} from "lucide-react";

export const siteContent = {
    seo: {
        title: "Progress Syncer - The All-in-One Planner, Mindset & Goal Tracker",
        description: "Transform your body and mind. Plan your workouts, track your habits, log your meals, and collaborate with your teamall in one place.",
        keywords: "fitness tracker, habit tracker, workout planner, team collaboration, goal setting",
        ogImage: "/og-image.jpg",
        twitterHandle: "@progresssyncer"
    },
    navbar: {
        brand: "Progress Syncer",
        links: [
            { label: "Features", href: "#features" },
            { label: "Community", href: "#testimonials" },
            { label: "Pricing", href: "#pricing" },
            { label: "FAQ", href: "#faq" }
        ],
        cta: {
            dashboard: "Dashboard",
            login: "Log in",
            google: "Continue with Google",
            start: "Get Started Free"
        },
        badge: "New: AI Coaching is Live!"
    },
    hero: {
        badge: "Rated #1 Trending Productivity App of 2026",
        title: {
            first: "Build the habit.",
            highlight: "See the results."
        },
        description: "Stop juggling spreadsheets and 5 different apps. Progress Syncer brings your workouts, nutrition, daily planners, and mindset journaling into one powerful ecosystem.",
        buttons: {
            google: "Sign up with Google",
            start: "Start for Free"
        },
        stats: [
            { icon: Target, label: "Weekly Goals", value: "Crushed", color: "emerald" },
            { icon: Activity, label: "Consistency", value: "98% Score", color: "blue" }
        ],
        logos: {
            title: "POWERING OVER 10,000+ ATHLETES AND TEAMS",
            names: ["GymGenius", "FitFam Global", "IronWorks", "CrossFit Horizon", "Peak Performance", "Elevate Athletics"]
        }
    },
    metrics: [
        { title: "Active Users", value: "25k+" },
        { title: "Workouts Logged", value: "1.2M+" },
        { title: "Goals Smashed", value: "850k" }
    ],
    features: {
        id: "features",
        title: "Everything you need to level up.",
        subtitle: "Smarter planning. Simpler tracking. Stronger results. All the tools you need to stop guessing and start growing.",
        items: [
            { icon: Dumbbell, title: "Workout Logging", description: "Design complex sets, track your rep maximums, and record rest periods effortlessly." },
            { icon: BarChart3, title: "Deep Analytics", description: "Visualize your volume, intensity, and body measurements over time in beautiful charts." },
            { icon: Brain, title: "Mindset & Journal", description: "Mental health matters. Log your daily mood, sleep, and write journal entries to stay centered." },
            { icon: Calendar, title: "Smart Planner", description: "Schedule your days with precision. To-Do lists integrated right into your calendar." },
            { icon: Users, title: "Team Collaboration", description: "Invite friends, share routines, compete on leaderboards, and motivate each other." },
            { icon: Zap, title: "AI Insights", description: "Our AI analyzes your performance to suggest progressive overload and recovery days." }
        ]
    },
    detailedFeatures: [
        {
            title: "Supercharge your gains equipped with real data.",
            description: "No more guessing. See exactly how your body is responding to your programs. Track everything from bicep circumference to resting heart rate, and correlate it directly to your workout volume.",
            features: [
                "Automated progression charts",
                "Advanced 1RM calculators",
                "Historical comparisons"
            ],
            image: "/dashboard-preview.png",
            align: "right"
        },
        {
            title: "Dominate your day with the integrated Planner.",
            description: "Fitness doesn't happen in a vacuum. You have a life, a job, and responsibilities. Our built-in planner ensures you make time for what matters, without missing a session.",
            features: [
                "Time-blocking calendar view",
                "Recurring task automation",
                "Priority tagging"
            ],
            image: "/dashboard-preview.png",
            align: "left"
        }
    ],
    testimonials: {
        id: "testimonials",
        title: "Don't just take our word for it.",
        subtitle: "Join thousands of athletes who have completely transformed their lives using Progress Syncer.",
        items: [
            {
                quote: "This app replaced MyFitnessPal, Apple Health, and Notion for me. It's insanely powerful yet ridiculously simple to use. Worth every penny.",
                name: "Sarah Jenkins",
                role: "Triathlete",
                image: "https://i.pravatar.cc/150?img=1"
            },
            {
                quote: "The team collaboration feature is unmatched. My entire coaching roster uses it now. We share templates, track PRs, and see weekly leaderboards.",
                name: "David Chen",
                role: "Strength Coach",
                image: "https://i.pravatar.cc/150?img=11"
            },
            {
                quote: "Having my mindset journal next to my workout logs fundamentally changed how I approach fitness. I finally see the connection between my sleep, stress, and strength.",
                name: "Elena Rodriguez",
                role: "Yoga Instructor",
                image: "https://i.pravatar.cc/150?img=5"
            },
            {
                quote: "The analytics are beautiful and the dark mode is gorgeous. I look forward to logging my workouts just to see the graphs update.",
                name: "Marcus Johnson",
                role: "Powerlifter",
                image: "https://i.pravatar.cc/150?img=8"
            },
            {
                 quote: "Perfect for busy professionals. I schedule my workouts, track my tasks, and get my life together all on one dashboard.",
                 name: "Alex Patel",
                 role: "Product Manager",
                 image: "https://i.pravatar.cc/150?img=12"
            }
        ]
    },
    pricing: {
        id: "pricing",
        title: "Invest in your growth.",
        subtitle: "Simple, transparent pricing. Cancel anytime. No hidden fees.",
        plans: [
            {
                name: "Starter",
                price: "$0",
                period: "forever",
                description: "Perfect for beginners establishing a routine.",
                features: [
                    "Basic workout logging",
                    "Simple to-do lists",
                    "Limited community access",
                    "Standard analytics"
                ],
                buttonText: "Start for Free",
                popular: false,
                variant: "outline"
            },
            {
                name: "Pro",
                price: "$12",
                period: "/month",
                description: "For dedicated athletes demanding data.",
                features: [
                    "Everything in Starter",
                    "Unlimited custom exercises",
                    "Advanced analytics & 1RM tracking",
                    "AI workout recommendations",
                    "Mindset & Journaling"
                ],
                buttonText: "Start Pro Trial",
                popular: true,
                variant: "default"
            }
        ]
    },
    faq: {
        id: "faq",
        title: "Frequently Asked Questions",
        subtitle: "Got questions? We've got answers.",
        items: [
            {
                question: "Do I need any special equipment to use Progress Syncer?",
                answer: "Not at all. Progress Syncer is designed for all types of fitness, whether you're lifting heavy in a commercial gym, doing calisthenics at home, or running outdoors. You can customize the exercises to fit your routine."
            },
            {
                question: "Can I import my data from other apps?",
                answer: "Yes! You can currently import CSV exports from Strong, Hevy, MyFitnessPal, and Apple Health. We are constantly working on adding more direct integrations."
            },
            {
                question: "How does the AI recommendation engine work?",
                answer: "Our AI analyzes your past performance (volume, intensity), your sleep data, and your subjective mood ratings to suggest the optimal weight and reps for your next session to ensure progressive overload without overtraining."
            },
            {
                question: "Is there a long-term commitment?",
                answer: "No. You can cancel your subscription at any time. If you cancel, you'll retain your Pro tier features until the end of your current billing cycle."
            },
            {
                question: "Is my data private?",
                answer: "We take privacy extremely seriously. We use enterprise-grade end-to-end encryption. We never sell your personal data or workout habits to advertisers."
            }
        ]
    },
    footer: {
        brand: "Progress Syncer",
        description: "Your all-in-one operating system for physical and mental growth. Create once, share everywhere. Stop guessing, start progressing.",
        newsletterText: "Want free training programs and productivity tips? Join our newsletter.",
        copyright: " 2026 Progress Syncer Inc. All rights reserved.",
        columns: [
            {
                title: "Product",
                links: [
                    { label: "Features", href: "#features" },
                    { label: "Pricing", href: "#pricing" },
                    { label: "Testimonials", href: "#testimonials" },
                    { label: "FAQ", href: "#faq" },
                    { label: "Changelog", href: "#" }
                ]
            },
            {
                title: "Resources",
                links: [
                    { label: "Help Center", href: "#" },
                    { label: "Blog", href: "#" },
                    { label: "Workout Templates", href: "#" },
                    { label: "Community Discord", href: "#" }
                ]
            },
            {
                title: "Company",
                links: [
                    { label: "About Us", href: "#" },
                    { label: "Careers", href: "#" },
                    { label: "Privacy Policy", href: "/privacy" },
                    { label: "Terms of Service", href: "/terms" },
                    { label: "Contact", href: "mailto:support@progresssyncer.com" }
                ]
            }
        ],
        socials: {
            twitter: "https://twitter.com/progresssyncer",
            instagram: "https://instagram.com/progresssyncer",
            youtube: "https://youtube.com/progresssyncer"
        }
    }
};
