import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (email: string, pass: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isAuthenticated: false,
    loading: true,
    login: async () => { },
    loginWithGoogle: async () => { },
    logout: async () => { }
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const login = async (email: string, pass: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password: pass
        });
        if (error) throw error;
    }

    const loginWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: (window.location.hostname === 'localhost' ? window.location.origin : 'https://app.progresssyncer.com') + '/dashboard'
            }
        });
        if (error) throw error;
    }

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    }

    useEffect(() => {
        // Init isAuthenticated
        setIsAuthenticated(document.cookie.includes('ps_auth_status=1'));

        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (!loading) {
            setIsAuthenticated(!!user || document.cookie.includes('ps_auth_status=1'));
            
            let domain = window.location.hostname;
            if (domain.includes('progresssyncer.com')) {
                domain = '.progresssyncer.com';
            }
            
            if (user) {
                document.cookie = 'ps_auth_status=1; domain=' + domain + '; path=/; max-age=31536000; SameSite=Lax;';
            } else {
                document.cookie = 'ps_auth_status=; domain=' + domain + '; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            }
        }
    }, [user, loading]);

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, loading, login, loginWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
