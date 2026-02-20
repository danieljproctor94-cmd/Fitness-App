import { Button } from "@/components/ui/button";
import { Check, ArrowRight, ChevronDown, Rocket, Award, Star, Zap, Activity, Target } from "lucide-react";
import { siteContent } from "@/config/siteContent";
import { useAuth } from "@/features/auth/AuthContext";
import { getAppUrl } from "@/lib/domain";
import { SEO } from "@/components/shared/SEO";
import { useState } from "react";

export default function Landing() {
    const { loginWithGoogle, isAuthenticated } = useAuth();
    const { hero, features, detailedFeatures, testimonials, pricing, faq, metrics } = siteContent;
    const [openFaq, setOpenFaq] = useState<number | null>(0);

    return (
        <div className="flex flex-col min-h-screen bg-background selection:bg-primary/30">
            <SEO
                title={siteContent.seo.title}
                description={siteContent.seo.description}
                keywords={siteContent.seo.keywords}
            />

            {/* HERO SECTION */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-24 overflow-hidden">
                {/* Background Decor */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background -z-10" />
                <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-full h-[800px] bg-primary/20 blur-[150px] rounded-[100%] opacity-50 -z-10" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary font-medium text-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        {hero.badge}
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 leading-[1.1] animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                        {hero.title.first}<br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-300 to-indigo-500 animate-gradient-x">
                            {hero.title.highlight}
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                        {hero.description}
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                        {isAuthenticated ? (
                            <a href={getAppUrl('/dashboard')}>
                                <Button size="lg" className="h-14 px-8 w-64 text-lg rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/25 transition-all hover:scale-105 font-bold">
                                    Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </a>
                        ) : (
                            <>
                                <a href={getAppUrl('/register')}>
                                    <Button size="lg" className="h-14 px-8 w-full sm:w-64 text-lg rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xl shadow-primary/30 transition-all hover:scale-105 hover:-translate-y-1 font-bold">
                                        {hero.buttons.start} <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </a>
                                <Button
                                    onClick={loginWithGoogle}
                                    variant="outline"
                                    size="lg"
                                    className="h-14 px-8 w-full sm:w-auto text-lg rounded-xl border-border bg-card/50 backdrop-blur-sm hover:bg-muted text-foreground transition-all hover:scale-105 font-medium"
                                >
                                    <svg className="mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                                        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                                        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                                        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                                        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                                    </svg>
                                    {hero.buttons.google}
                                </Button>
                            </>
                        )}
                    </div>
                    
                    <div className="mt-8 flex items-center justify-center gap-6 text-sm font-medium text-muted-foreground animate-in fade-in duration-1000 delay-500">
                        <div className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Cancel anytime</div>
                        <div className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> No credit card required</div>
                    </div>

                    {/* Dashboard Preview Image */}
                    <div className="mt-20 relative max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500 perspective-1000">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background z-20 pointer-events-none" style={{height: '110%'}}></div>
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary via-indigo-500 to-purple-600 rounded-2xl blur-xl opacity-30 z-0"></div>
                        <div className="relative rounded-2xl border border-white/10 bg-card/80 backdrop-blur-xl shadow-2xl overflow-hidden aspect-[16/9] z-10 transform-gpu rotate-[8deg] scale-100 hover:rotate-0 hover:scale-[1.02] transition-all duration-[800ms] ease-out">
                            
                            {/* Browser Mockup Header */}
                            <div className="h-10 border-b border-border/50 bg-black/40 flex items-center px-4 gap-2">
                                <div className="h-3 w-3 rounded-full bg-red-500/80"></div>
                                <div className="h-3 w-3 rounded-full bg-yellow-500/80"></div>
                                <div className="h-3 w-3 rounded-full bg-emerald-500/80"></div>
                                <div className="mx-auto flex-1 max-w-xs h-6 bg-white/5 rounded-full flex items-center justify-center text-[10px] text-white/30 tracking-widest font-mono">
                                    app.progresssyncer.com
                                </div>
                            </div>
                            
                            <img
                                src="/dashboard-preview.png"
                                alt="Dashboard Preview"
                                className="w-full h-full object-cover object-top"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.parentElement!.innerHTML += `
                                        <div class="absolute inset-0 flex flex-col items-center justify-center bg-card p-12 text-center pointer-events-none">
                                            <div class="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary opacity-50"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                                            </div>
                                            <p class="text-2xl font-bold text-foreground">Aesthetic Analytics</p>
                                            <p class="text-muted-foreground mt-2 max-w-md mx-auto">Upload 'dashboard-preview.png' to your public folder to see your stunning UI featured right here.</p>
                                        </div>
                                    `;
                                }}
                            />
                        </div>

                        {/* Floating Metrics Widgets */}
                        <div className="absolute top-1/4 -right-12 z-30 p-4 bg-card border border-border/50 rounded-2xl shadow-xl hidden lg:block animate-bounce" style={{animationDuration: '4s'}}>
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                    <Target className="h-6 w-6" />
                                </div>
                                <div className="text-left">
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Goal Hit</p>
                                    <p className="text-lg font-bold text-foreground">315lb Deadlift</p>
                                </div>
                            </div>
                        </div>

                        <div className="absolute bottom-1/4 -left-12 z-30 p-4 bg-card border border-border/50 rounded-2xl shadow-xl hidden lg:block animate-bounce" style={{animationDuration: '5s', animationDelay: '1s'}}>
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <Activity className="h-6 w-6" />
                                </div>
                                <div className="text-left">
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Consistency</p>
                                    <p className="text-lg font-bold text-foreground">14 Day Streak</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* LOGOS SECTION */}
            <section className="py-10 border-y border-border/50 bg-black/20">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-sm font-semibold text-muted-foreground tracking-[0.2em] mb-8">{hero.logos.title}</p>
                    <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-1000">
                        {hero.logos.names.map((logo, idx) => (
                            <div key={idx} className="text-xl font-black tracking-tighter text-foreground/80 flex items-center gap-2">
                                <Zap className="h-5 w-5 text-primary" /> {logo}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* METRICS SECTION */}
            <section className="py-24 bg-background">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-border/50">
                        {metrics.map((metric, idx) => (
                            <div key={idx} className="p-8 text-center">
                                <p className="text-5xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-foreground to-foreground/50 mb-2">
                                    {metric.value}
                                </p>
                                <p className="text-lg font-medium text-muted-foreground">{metric.title}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FEATURES GRID SECTION */}
            <section id="features" className="py-32 bg-muted/20 relative">
                <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:32px_32px]" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-20">
                        <h2 className="text-sm font-bold tracking-widest text-primary uppercase mb-3">Workflow OS</h2>
                        <h3 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">{features.title}</h3>
                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                            {features.subtitle}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.items.map((item, index) => {
                            const Icon = item.icon;
                            return (
                                <div key={index} className="p-8 rounded-3xl bg-card border border-border/50 hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 group">
                                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                                        <Icon className="h-7 w-7" />
                                    </div>
                                    <h4 className="text-2xl font-bold mb-3">{item.title}</h4>
                                    <p className="text-muted-foreground leading-relaxed font-medium">{item.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* DETAILED ALTERNATE FEATURES */}
            <section className="py-32 bg-background overflow-hidden relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-32">
                    {detailedFeatures.map((feature, idx) => (
                        <div key={idx} className={`flex flex-col lg:flex-row items-center gap-16 ${feature.align === 'left' ? 'lg:flex-row-reverse' : ''}`}>
                            <div className="flex-1 space-y-8">
                                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                                    <Rocket className="h-6 w-6" />
                                </div>
                                <h3 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                                    {feature.title}
                                </h3>
                                <p className="text-xl text-muted-foreground leading-relaxed">
                                    {feature.description}
                                </p>
                                <ul className="space-y-4">
                                    {feature.features.map((listFeature, lidx) => (
                                        <li key={lidx} className="flex items-center gap-3 text-lg font-medium">
                                            <div className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                                                <Check className="h-4 w-4" />
                                            </div>
                                            {listFeature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            
                            <div className="flex-1 w-full relative">
                                <div className="absolute -inset-4 bg-gradient-to-tr from-primary/30 to-purple-500/30 blur-3xl opacity-40 rounded-[3rem]" />
                                <div className="relative rounded-3xl border border-white/10 bg-black/50 p-2 shadow-2xl">
                                    <img src={feature.image} alt={feature.title} className="rounded-2xl w-full h-auto object-cover opacity-80 mix-blend-screen" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* TESTIMONIALS SECTION */}
            <section id="testimonials" className="py-32 bg-muted/30 border-y border-border/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <h2 className="text-sm font-bold tracking-widest text-primary uppercase mb-3">Wall of Love</h2>
                        <h3 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">{testimonials.title}</h3>
                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                            {testimonials.subtitle}
                        </p>
                    </div>

                    <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                        {testimonials.items.map((testim, idx) => (
                            <div key={idx} className="break-inside-avoid p-8 rounded-3xl bg-card border border-border/50 shadow-lg relative overflow-hidden group hover:border-primary/50 transition-colors">
                                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <svg className="w-16 h-16 fill-foreground" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" /></svg>
                                </div>
                                <div className="flex gap-1 mb-6">
                                    {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-yellow-500 text-yellow-500" />)}
                                </div>
                                <p className="text-lg leading-relaxed text-foreground/90 font-medium mb-8 relative z-10">
                                    "{testim.quote}"
                                </p>
                                <div className="flex items-center gap-4 border-t border-border/50 pt-6">
                                    <img src={testim.image} alt={testim.name} className="h-12 w-12 rounded-full ring-2 ring-background grayscale group-hover:grayscale-0 transition-all object-cover" />
                                    <div>
                                        <p className="font-bold text-foreground">{testim.name}</p>
                                        <p className="text-sm text-primary font-medium">{testim.role}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* PRICING SECTION */}
            <section id="pricing" className="py-32 bg-background relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[600px] bg-primary/10 blur-[150px] rounded-full opacity-40 -z-10" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-20">
                        <h3 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">{pricing.title}</h3>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            {pricing.subtitle}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {pricing.plans.map((plan, index) => (
                            <div key={index} className={`relative p-10 rounded-[2.5rem] border ${plan.popular ? 'border-primary bg-primary/10 shadow-2xl shadow-primary/20 scale-105 z-20' : 'border-border bg-card/50 backdrop-blur-md z-10'} flex flex-col`}>
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-primary text-primary-foreground text-sm font-bold tracking-widest uppercase rounded-full shadow-lg shadow-primary/30">
                                        Most Popular
                                    </div>
                                )}
                                <div className="mb-8">
                                    <h3 className="text-2xl font-black mb-2">{plan.name}</h3>
                                    <p className="text-muted-foreground text-sm mb-8 h-10">{plan.description}</p>
                                    <div className="flex items-end gap-1 mb-2">
                                        <span className="text-5xl font-black tracking-tighter">{plan.price}</span>
                                        <span className="text-muted-foreground font-medium mb-1">{plan.period}</span>
                                    </div>
                                </div>
                                <ul className="space-y-4 mb-10 flex-1">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <div className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${plan.popular ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                                                <Check className="h-3 w-3" />
                                            </div>
                                            <span className="text-sm font-medium">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Button
                                    size="lg"
                                    variant={plan.variant as "default" | "outline"}
                                    className={`w-full rounded-2xl h-14 text-lg font-bold ${!plan.popular ? 'bg-background hover:bg-muted border-border' : ''}`}
                                    onClick={plan.name === "Starter" ? () => window.location.href = getAppUrl('/register') : undefined}
                                >
                                    {plan.buttonText}
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ SECTION */}
            <section id="faq" className="py-32 bg-muted/20 border-t border-border/50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h3 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">{faq.title}</h3>
                        <p className="text-xl text-muted-foreground">
                            {faq.subtitle}
                        </p>
                    </div>

                    <div className="space-y-4 border border-border/50 bg-card rounded-2xl p-2">
                        {faq.items.map((item, idx) => (
                            <div key={idx} className="border border-transparent hover:border-border/30 rounded-xl overflow-hidden transition-all duration-300">
                                <button
                                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-muted/10 focus:outline-none rounded-xl"
                                >
                                    <span className="font-bold text-lg">{item.question}</span>
                                    <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${openFaq === idx ? 'rotate-180 text-primary' : ''}`} />
                                </button>
                                <div 
                                    className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${openFaq === idx ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}
                                >
                                    <p className="text-muted-foreground leading-relaxed text-lg pt-2">
                                        {item.answer}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FINAL CTA SECTION */}
            <section className="py-32 relative overflow-hidden bg-background border-t border-border">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
                
                <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
                    <div className="inline-flex h-20 w-20 rounded-3xl bg-primary shadow-2xl shadow-primary/50 items-center justify-center mb-8 animate-bounce" style={{animationDuration: '3s'}}>
                        <Award className="h-10 w-10 text-primary-foreground" />
                    </div>
                    <h2 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter">Ready to <span className="text-primary tracking-tighter">synthesize</span> your life?</h2>
                    <p className="text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
                        Join the fastest growing platform of elite performers out there today.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button onClick={() => window.location.href = getAppUrl(isAuthenticated ? '/dashboard' : '/register')} size="lg" className="h-16 px-10 text-xl font-bold rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xl shadow-primary/30 transition-all hover:scale-105 hover:-translate-y-1">
                            {isAuthenticated ? 'Enter Dashboard' : 'Get Started Now'} <ArrowRight className="ml-3 h-6 w-6" />
                        </Button>
                        {!isAuthenticated && (
                            <Button variant="outline" size="lg" className="h-16 px-10 text-xl font-bold rounded-2xl border-border bg-card hover:bg-muted hover:scale-105 transition-all">
                                Talk to Sales
                            </Button>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
