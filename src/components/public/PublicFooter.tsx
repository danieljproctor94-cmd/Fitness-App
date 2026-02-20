import { siteContent } from "@/config/siteContent";
import { Github, Twitter, Instagram, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useData } from "@/features/data/DataContext";

export function PublicFooter() {
    const { appLogo } = useData();
    return (
        <footer className="bg-background border-t border-border/50 pt-20 pb-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Top Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
                    
                    {/* Brand Column (Takes up 4 cols on large) */}
                    <div className="lg:col-span-4 flex flex-col justify-between">
                        <div>
                            {appLogo ? (
                                <img src={appLogo} alt="Logo" className="h-8 md:h-10 w-auto object-contain mb-6" />
                            ) : (
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-10 w-10 bg-primary/20 rounded-xl flex items-center justify-center font-bold text-primary">PS</div>
                                    <span className="font-bold text-2xl tracking-tight">{siteContent.footer.brand}</span>
                                </div>
                            )}
                            <p className="text-muted-foreground mb-8 max-w-sm leading-relaxed">
                                {siteContent.footer.description}
                            </p>
                        </div>
                        
                        {/* Social Links Matrix */}
                        <div className="flex items-center gap-4">
                            <a href={siteContent.footer.socials.twitter} className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary/20 hover:text-primary transition-colors">
                                <Twitter className="h-5 w-5" />
                            </a>
                            <a href={siteContent.footer.socials.instagram} className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary/20 hover:text-primary transition-colors">
                                <Instagram className="h-5 w-5" />
                            </a>
                            <a href="https://github.com/danieljproctor94-cmd/Fitness-App" className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary/20 hover:text-primary transition-colors">
                                <Github className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    {/* Columns (Takes up 5 cols) */}
                    <div className="lg:col-span-4 grid grid-cols-2 sm:grid-cols-3 gap-8">
                        {siteContent.footer.columns.map((col, idx) => (
                            <div key={idx}>
                                <h4 className="font-semibold text-foreground mb-4">{col.title}</h4>
                                <ul className="space-y-3">
                                    {col.links.map((link, lidx) => (
                                        <li key={lidx}>
                                            <a href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                                {link.label}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    {/* Newsletter (Takes up 4 cols) */}
                    <div className="lg:col-span-4">
                        <div className="bg-muted/30 border border-border/50 rounded-2xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full blur-2xl"></div>
                            <h4 className="font-bold text-lg mb-2 relative z-10">Stay in the loop</h4>
                            <p className="text-sm text-muted-foreground mb-4 relative z-10">
                                {siteContent.footer.newsletterText}
                            </p>
                            <form className="flex gap-2 relative z-10">
                                <Input type="email" placeholder="Email address" className="bg-background border-border" />
                                <Button type="button" variant="default" className="w-12 px-0 bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground focus:ring-primary/20 border border-primary/20 shadow-none">
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </div>

                </div>

                {/* Bottom Section */}
                <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-border/50">
                    <p className="text-sm text-muted-foreground mb-4 md:mb-0">
                        {siteContent.footer.copyright}
                    </p>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            All systems operational
                        </div>
                    </div>
                </div>

            </div>
        </footer>
    );
}
