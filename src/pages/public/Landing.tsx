import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Users } from "lucide-react";
import { siteContent } from "@/config/siteContent";
import { useAuth } from "@/features/auth/AuthContext";
import { getAppUrl } from "@/lib/domain";
import { SEO } from "@/components/shared/SEO";

export default function Landing() {
    const { loginWithGoogle } = useAuth();
    const { hero, features, pricing } = siteContent;

    return (
        <div className="flex flex-col min-h-screen">
            <SEO
                title={siteContent.seo.title}
                description={siteContent.seo.description}
                keywords={siteContent.seo.keywords}
            />
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background -z-10" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-primary/10 blur-[120px] rounded-full opacity-60 -z-10" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">


                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                        {hero.title.first}<br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-400 to-primary animate-gradient-x">
                            {hero.title.highlight}
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                        {hero.description}
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                        <Button
                            onClick={loginWithGoogle}
                            size="lg"
                            className="h-14 px-8 w-64 text-lg rounded-full shadow-xl shadow-primary/20 bg-white text-black hover:bg-gray-100 border border-transparent transition-all hover:scale-105"
                        >
                            <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                            </svg>
                            {hero.buttons.google}
                        </Button>
                        <a href={getAppUrl('/register')}>
                            <Button size="lg" className="h-14 px-8 w-64 text-lg rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all hover:scale-105">
                                {hero.buttons.start} <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </a>
                    </div>

                    {/* Floating Dashboard Preview */}
                    <div className="mt-24 relative max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
                        {/* Floating Elements (Decorations) */}
                        <div className="absolute -top-12 -left-12 p-4 bg-card/80 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl hidden md:block animate-bounce duration-[3000ms]">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                                    <Check className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium">Daily Goal</p>
                                    <p className="text-sm font-bold">Completed</p>
                                </div>
                            </div>
                        </div>

                        <div className="absolute -bottom-8 -right-8 p-4 bg-card/80 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl hidden md:block animate-bounce duration-[4000ms]">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                                    <Users className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium">Team Spirit</p>
                                    <p className="text-sm font-bold">+12% vs last week</p>
                                </div>
                            </div>
                        </div>

                        {/* Main Image */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-indigo-600 rounded-3xl blur opacity-20"></div>
                        <div className="relative rounded-3xl border border-white/10 bg-background/50 backdrop-blur-xl shadow-2xl overflow-hidden aspect-video flex items-center justify-center group">
                            {/* Dashboard Screenshot Preview */}
                            <img
                                src="/dashboard-preview.png"
                                alt="Progress Sync Dashboard Preview"
                                className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                                onError={(e) => {
                                    // Fallback if image doesn't exist yet
                                    const parent = e.currentTarget.parentElement;
                                    if (parent) {
                                        parent.classList.add('bg-card');
                                        parent.innerHTML = `
                                            <div class="text-center p-12">
                                                <div class="h-24 w-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>
                                                </div>
                                                <p class="text-xl font-medium text-foreground">Interactive Dashboard</p>
                                                <p class="text-muted-foreground mt-2">Please add 'dashboard-preview.png' to public folder</p>
                                            </div>
                                        `;
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <div id="features" className="py-24 bg-muted/30 border-t border-white/5 scroll-mt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-32">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-extrabold mb-6">{features.title}</h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            {features.subtitle}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.items.map((item, index) => {
                            const Icon = item.icon;
                            return (
                                <div key={index} className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-colors">
                                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                                    <p className="text-muted-foreground">{item.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Pricing Section */}
            <div id="pricing" className="py-24 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/5 blur-[120px] rounded-full opacity-30 -z-10" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-extrabold mb-6">{pricing.title}</h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            {pricing.subtitle}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {pricing.plans.map((plan, index) => (
                            <div key={index} className={`relative p-8 rounded-3xl border ${plan.popular ? 'border-primary bg-primary/5 shadow-2xl shadow-primary/10' : 'border-border bg-card/50 backdrop-blur-sm'} flex flex-col`}>
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-sm font-medium rounded-full">
                                        Most Popular
                                    </div>
                                )}
                                <div className="mb-8">
                                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                                    <p className="text-muted-foreground mb-6">{plan.description}</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-extrabold">{plan.price}</span>
                                        <span className="text-muted-foreground">{plan.period}</span>
                                    </div>
                                </div>
                                <ul className="space-y-4 mb-8 flex-1">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-3">
                                            <div className={`h-5 w-5 rounded-full flex items-center justify-center ${plan.popular ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                                                <Check className="h-3 w-3" />
                                            </div>
                                            <span className="text-sm">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Button
                                    size="lg"
                                    variant={plan.popular ? "default" : "outline"}
                                    className="w-full rounded-full h-12 text-base"
                                    onClick={plan.name === "Free" ? () => window.location.href = getAppUrl('/register') : undefined}
                                >
                                    {plan.buttonText}
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 mix-blend-overlay"></div>
                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <h2 className="text-3xl md:text-5xl font-extrabold mb-6">Ready to transform your life?</h2>
                    <p className="text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
                        Join thousands of others who are crushing their goals with Progress Syncer.
                    </p>
                    <Button onClick={() => window.location.href = getAppUrl('/register')} size="lg" className="h-14 px-8 text-lg rounded-full bg-white text-primary hover:bg-gray-100 shadow-xl transition-all hover:scale-105">
                        Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </div>
            </section>
        </div>
    );
}
