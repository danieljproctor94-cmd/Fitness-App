import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, BarChart3, Users } from "lucide-react";

export default function Features() {
    return (
        <div className="min-h-screen">
            <div className="bg-muted/30 py-20 border-b border-border/40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-6">Features that empower you</h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Explore the tools designed to streamline your fitness journey and daily life.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-32">
                {/* Feature 1: Planner */}
                <FeatureSection
                    icon={<Calendar className="h-8 w-8 text-primary" />}
                    title="Smart Planner"
                    description="Never miss a workout or task again. Our intelligent planner handles recurring events, urgency levels, and reminders. Drag, drop, and organize your life with ease."
                    details={[
                        "Recurring tasks (Daily, Weekly, Monthly)",
                        "Urgency tagging (Low to Critical)",
                        "Custom push notifications",
                        "Sync with Google Calendar (Pro)"
                    ]}
                    align="left"
                    imagePlaceHolder="Planner UI"
                />

                {/* Feature 2: Analytics */}
                <FeatureSection
                    icon={<BarChart3 className="h-8 w-8 text-emerald-500" />}
                    title="Deep Analytics"
                    description="Visualize your progress like never before. Track weight trends, workout consistency, and habit streaks over time."
                    details={[
                        "Interactive weight gain/loss charts",
                        "Weekly workout goal tracking",
                        "BMI & Body Fat estimation",
                        "Export data anytime"
                    ]}
                    align="right"
                    imagePlaceHolder="Analytics UI"
                />

                {/* Feature 3: Collaboration */}
                <FeatureSection
                    icon={<Users className="h-8 w-8 text-indigo-500" />}
                    title="Team Collaboration"
                    description="Fitness is better together. Invite friends, share tasks, and compete on the leaderboard. Keep each other accountable."
                    details={[
                        "Shared To-Do lists",
                        "Team Leaderboards",
                        "Activity Feed",
                        "One-click invites"
                    ]}
                    align="left"
                    imagePlaceHolder="Team UI"
                />
            </div>

            {/* CTA */}
            <div className="py-20 bg-primary/5 border-y border-primary/10">
                <div className="max-w-4xl mx-auto text-center px-4">
                    <h2 className="text-3xl font-bold mb-6">See it in action</h2>
                    <p className="text-lg text-muted-foreground mb-8">
                        Start your free trial today and experience the difference.
                    </p>
                    <Link to="/register">
                        <Button size="lg" className="rounded-full px-10 text-lg">Join Progress Syncer</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

function FeatureSection({ icon, title, description, details, align, imagePlaceHolder }: any) {
    return (
        <div className={`flex flex-col gap-12 ${align === 'right' ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center`}>
            <div className="flex-1 space-y-8">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-muted border border-border shadow-sm">
                    {icon}
                </div>
                <h2 className="text-3xl font-bold">{title}</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                    {description}
                </p>
                <ul className="space-y-4">
                    {details.map((item: string, i: number) => (
                        <li key={i} className="flex items-center gap-3 font-medium">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                            {item}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="flex-1 w-full">
                <div className="aspect-[4/3] rounded-3xl bg-gradient-to-br from-muted to-muted/50 border border-border flex items-center justify-center shadow-xl">
                    <p className="text-muted-foreground font-medium text-lg">{imagePlaceHolder}</p>
                </div>
            </div>
        </div>
    );
}
