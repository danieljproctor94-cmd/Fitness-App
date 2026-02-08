import { Link } from "react-router-dom";
import { Github, Twitter, Instagram } from "lucide-react";

export function PublicFooter() {
    return (
        <footer className="bg-muted/30 border-t border-white/5 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                    <div className="col-span-1 md:col-span-1">
                        <Link to="/" className="flex items-center gap-2 mb-4">
                            <span className="font-bold text-xl tracking-tight">Progress Syncer</span>
                        </Link>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            The ultimate fitness companion for organizing your life, workouts, and mindset. Join thousands of users achieving their goals today.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4">Product</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link to="/features" className="hover:text-primary transition-colors">Features</Link></li>
                            <li><Link to="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
                            <li><Link to="/register" className="hover:text-primary transition-colors">Sign Up</Link></li>
                            <li><Link to="/login" className="hover:text-primary transition-colors">Login</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4">Legal</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link to="#" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                            <li><Link to="#" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                            <li><Link to="#" className="hover:text-primary transition-colors">Cookie Policy</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4">Connect</h4>
                        <div className="flex space-x-4">
                            <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Twitter className="h-5 w-5" /></a>
                            <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Instagram className="h-5 w-5" /></a>
                            <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Github className="h-5 w-5" /></a>
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} Progress Syncer. All rights reserved.</p>
                    <div className="flex gap-6">
                        <Link to="#" className="hover:text-foreground">Privacy</Link>
                        <Link to="#" className="hover:text-foreground">Terms</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
