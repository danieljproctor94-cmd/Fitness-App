import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { Link } from "react-router-dom";

export default function Pricing() {
    return (
        <div className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
                <h1 className="text-4xl md:text-6xl font-extrabold mb-6">Simple, Transparent Pricing</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Start for free, upgrade for power. No hidden fees.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* Free Plan */}
                <div className="rounded-3xl border border-border bg-card p-8 flex flex-col relative overflow-hidden">
                    <div className="mb-8">
                        <h3 className="text-2xl font-bold mb-2">Starter</h3>
                        <p className="text-muted-foreground">Perfect for beginners building habits.</p>
                    </div>
                    <div className="mb-8">
                        <span className="text-5xl font-extrabold">$0</span>
                        <span className="text-muted-foreground">/month</span>
                    </div>
                    <div className="flex-1 space-y-4 mb-8">
                        <FeatureItem text="Unlimited Task Management" />
                        <FeatureItem text="Workout Logging (Basic)" />
                        <FeatureItem text="Daily Mindset Journal" />
                        <FeatureItem text="1 Team Collaborator" />
                        <FeatureItem text="Basic Analytics (7 Days)" />
                        <FeatureItem text="No AI Insights" unavailable />
                        <FeatureItem text="Voice Tasks" unavailable />
                    </div>
                    <Link to="/register">
                        <Button variant="outline" className="w-full h-12 text-lg rounded-xl">
                            Get Started Free
                        </Button>
                    </Link>
                </div>

                {/* Pro Plan */}
                <div className="rounded-3xl border-2 border-primary bg-card/60 backdrop-blur-sm p-8 flex flex-col relative overflow-hidden shadow-2xl shadow-primary/10">
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-xl tracking-wider">
                        POPULAR
                    </div>
                    <div className="mb-8">
                        <h3 className="text-2xl font-bold mb-2 text-primary">Pro</h3>
                        <p className="text-muted-foreground">For dedicated athletes and organizers.</p>
                    </div>
                    <div className="mb-8">
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-extrabold">$9</span>
                            <span className="text-xl text-muted-foreground line-through">$19</span>
                        </div>
                        <span className="text-muted-foreground">/month</span>
                    </div>
                    <div className="flex-1 space-y-4 mb-8">
                        <FeatureItem text="Everything in Starter" />
                        <FeatureItem text="Unlimited Team Collaborators" />
                        <FeatureItem text="Advanced Analytics (Unlimited)" />
                        <FeatureItem text="AI Health Insights & Suggestions" />
                        <FeatureItem text="Voice-to-Task AI Assistant" />
                        <FeatureItem text="Priority Support" />
                        <FeatureItem text="Custom Themes" />
                    </div>
                    <Link to="/register">
                        <Button className="w-full h-12 text-lg rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                            Start 14-Day Free Trial
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

function FeatureItem({ text, unavailable = false }: { text: string, unavailable?: boolean }) {
    return (
        <div className={`flex items-center gap-3 ${unavailable ? "opacity-50" : ""}`}>
            {unavailable ? (
                <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <X className="h-3 w-3 text-muted-foreground" />
                </div>
            ) : (
                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-primary" />
                </div>
            )}
            <span className="text-sm font-medium">{text}</span>
        </div>
    );
}
