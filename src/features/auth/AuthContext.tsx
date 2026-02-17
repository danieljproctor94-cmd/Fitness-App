import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, pass: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: async () => { },
    loginWithGoogle: async () => { },
    logout: async () => { }
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

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
                redirectTo: window.location.origin + '/dashboard'
            }
        });
        if (error) throw error;
    }

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    }

    useEffect(() => {
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

    return (
        <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
