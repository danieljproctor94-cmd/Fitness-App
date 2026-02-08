import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useData } from "@/features/data/DataContext";
import { Menu, X, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { siteContent } from "@/config/siteContent";
import { getAppUrl } from "@/lib/domain";

export function PublicNavbar() {
    const { appLogo } = useData();
    const { user } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const scrollToSection = (id: string) => {
        setIsMenuOpen(false);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        } else {
            navigate("/");
            setTimeout(() => {
                const el = document.getElementById(id);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    };



    const { navbar } = siteContent;

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex-shrink-0 flex items-center gap-2">
                        {appLogo ? (
                            <img src={appLogo} alt="Logo" className="h-8 w-auto" />
                        ) : (
                            // Placeholder/Spacer to prevent layout shift
                            <div className="h-8 w-8"></div>
                        )}
                        {/* <span className="font-bold text-xl tracking-tight hidden sm:block">{navbar.brand}</span> */}
                    </Link>

                    <div className="hidden md:flex items-center gap-8 bg-muted/30 px-6 py-2 rounded-full border border-border/50 backdrop-blur-sm">
                        {navbar.links.map((link) => (
                            <button
                                key={link.label}
                                onClick={() => scrollToSection(link.href.replace('#', ''))}
                                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {link.label}
                            </button>
                        ))}
                    </div>

                    <div className="hidden md:flex items-center gap-6">
                        {user ? (
                            <a href={getAppUrl('/dashboard')}>
                                <Button className="rounded-full px-6">{navbar.cta.dashboard}</Button>
                            </a>
                        ) : (
                            <>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-medium backdrop-blur-md">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    <span className="text-muted-foreground">{navbar.badge}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button onClick={() => window.location.href = getAppUrl('/login')} variant="outline" className="rounded-full px-4 border-input bg-white text-black hover:bg-gray-100 hover:text-black">
                                        <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                                            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                                            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                                            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                                            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                                        </svg>
                                        {navbar.cta.login}
                                    </Button>
                                    <a href={getAppUrl('/register')}>
                                        <Button className="rounded-full px-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105">
                                            {navbar.cta.start} <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </a>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="md:hidden">
                        <button onClick={toggleMenu} className="p-2 text-muted-foreground hover:text-foreground">
                            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {isMenuOpen && (
                <div className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border absolute w-full z-50 animate-in slide-in-from-top-4">
                    <div className="px-4 pt-4 pb-6 space-y-2">
                        {navbar.links.map((link) => (
                            <button
                                key={link.label}
                                onClick={() => scrollToSection(link.href.replace('#', ''))}
                                className="block w-full text-left px-3 py-3 rounded-lg text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            >
                                {link.label}
                            </button>
                        ))}

                        <div className="pt-4 flex justify-center">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium backdrop-blur-md">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-muted-foreground">{navbar.badge}</span>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-border">
                            {user ? (
                                <a href={getAppUrl('/dashboard')} onClick={() => setIsMenuOpen(false)}>
                                    <Button className="w-full rounded-full h-12 text-lg">{navbar.cta.dashboard}</Button>
                                </a>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    <Button onClick={() => window.location.href = getAppUrl('/login')} variant="outline" className="w-full rounded-full h-11 text-base border-input bg-white text-black hover:bg-gray-100 hover:text-black px-0">
                                        <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                                            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                                            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                                            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                                            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                                        </svg>
                                        Google
                                    </Button>
                                    <a href={getAppUrl('/register')} onClick={() => setIsMenuOpen(false)} className="w-full">
                                        <Button className="w-full rounded-full h-11 text-base bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 px-0">
                                            {navbar.cta.start.replace('for ', '')}
                                        </Button>
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
