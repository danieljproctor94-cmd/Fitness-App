import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useData } from "@/features/data/DataContext";
import { Menu, X, LogOut, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { siteContent } from "@/config/siteContent";
import { getAppUrl } from "@/lib/domain";

export function PublicNavbar() {
    const { appLogo } = useData();
    const { isAuthenticated, logout, loginWithGoogle } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const handleLogout = async () => {
        await logout();
        navigate("/");
    };

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
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-background/80 backdrop-blur-lg border-b border-border' : 'bg-transparent py-4'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 rounded-full border border-transparent transition-all">
                    
                    {/* Logo */}
                    <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex-shrink-0 flex items-center gap-2">
                        {appLogo ? (
                            <img src={appLogo} alt="Logo" className="h-10 w-auto" />
                        ) : (
                            <div className="h-10 w-10 bg-primary/20 rounded-xl flex items-center justify-center font-bold text-primary">PS</div>
                        )}
                        <span className="font-bold text-xl tracking-tight hidden sm:block">{navbar.brand}</span>
                    </Link>

                    {/* Desktop Links (Pill) */}
                    <div className="hidden md:flex items-center gap-1 bg-muted/40 p-1.5 rounded-full border border-border/50 backdrop-blur-sm">
                        {navbar.links.map((link) => (
                            <button
                                key={link.label}
                                onClick={() => scrollToSection(link.href.replace('#', ''))}
                                className="text-sm font-medium px-4 py-1.5 rounded-full text-foreground/70 hover:text-foreground hover:bg-background/80 transition-all"
                            >
                                {link.label}
                            </button>
                        ))}
                    </div>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-3">
                        {isAuthenticated ? (
                            <div className="flex items-center gap-3">
                                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">Log out</Button>
                                <a href={getAppUrl('/dashboard')}>
                                    <Button className="rounded-full px-5 h-10 shadow-lg shadow-primary/20 hover:scale-105 transition-transform">{navbar.cta.dashboard}</Button>
                                </a>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Button onClick={loginWithGoogle} variant="ghost" className="rounded-full px-4 h-10 text-sm font-medium hover:bg-muted/50">
                                    {navbar.cta.login}
                                </Button>
                                <a href={getAppUrl('/register')}>
                                    <Button className="rounded-full px-5 h-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105 group font-medium text-sm">
                                        {navbar.cta.start} <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button onClick={toggleMenu} className="p-2 -mr-2 text-foreground/80 hover:text-foreground transition-colors">
                            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>

                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMenuOpen && (
                <div className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border absolute w-full z-50 animate-in slide-in-from-top-4">
                    <div className="px-4 py-6 space-y-4">
                        <div className="flex flex-col space-y-2 mb-6">
                            {navbar.links.map((link) => (
                                <button
                                    key={link.label}
                                    onClick={() => scrollToSection(link.href.replace('#', ''))}
                                    className="w-full text-left px-4 py-3 rounded-xl text-lg font-medium text-foreground/80 hover:text-foreground hover:bg-muted/50 transition-colors"
                                >
                                    {link.label}
                                </button>
                            ))}
                        </div>

                        <div className="pt-4 border-t border-border">
                            {isAuthenticated ? (
                                <div className="space-y-3">
                                    <a href={getAppUrl('/dashboard')} onClick={() => setIsMenuOpen(false)}>
                                        <Button className="w-full rounded-xl h-12 text-lg shadow-lg shadow-primary/20">{navbar.cta.dashboard}</Button>
                                    </a>
                                    <Button variant="ghost" onClick={handleLogout} className="w-full h-12 text-red-500 hover:text-red-600 hover:bg-red-500/10">
                                        <LogOut className="h-5 w-5 mr-2" />
                                        Log out
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    <Button onClick={loginWithGoogle} variant="outline" className="w-full rounded-xl h-12 text-base border-input bg-card hover:bg-muted">
                                        <svg className="mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                                            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                                            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                                            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                                            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                                        </svg>
                                        Continue with Google
                                    </Button>
                                    <a href={getAppUrl('/register')} onClick={() => setIsMenuOpen(false)} className="w-full">
                                        <Button className="w-full rounded-xl h-12 text-base bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                                            {navbar.cta.start}
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
