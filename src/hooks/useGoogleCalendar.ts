import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/AuthContext';
import { supabase } from '@/lib/supabase';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

export interface GoogleEvent {
    id: string;
    summary: string;
    description?: string;
    start: { dateTime?: string; date?: string };
    end: { dateTime?: string; date?: string };
    htmlLink: string;
}

export function useGoogleCalendar() {
    const { user } = useAuth();
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isGisLoaded, setIsGisLoaded] = useState(false);

    // 1. Check if user already has sync enabled in our DB
    useEffect(() => {
        if (!user) return;

        const checkSyncStatus = async () => {
            const { data, error } = await supabase
                .from('google_sync_tokens')
                .select('id')
                .single();

            if (data && !error) {
                setIsConnected(true);
            }
        };

        checkSyncStatus();
    }, [user]);

    // 2. Load Google Identity Services (GIS) Script
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = () => setIsGisLoaded(true);
        document.body.appendChild(script);
    }, []);

    const connect = useCallback(() => {
        if (!isGisLoaded || !CLIENT_ID) {
            toast.error("Calendar service is still loading...");
            return;
        }

        const client = (window as any).google.accounts.oauth2.initCodeClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            ux_mode: 'popup',
            access_type: 'offline',
prompt: 'consent', // CRITICAL: This requests the Refresh Token
            callback: async (response: any) => {
                if (response.code) {
                    setIsLoading(true);
                    try {
                        // SEND CODE TO BACKEND (Supabase Edge Function)
                        // This function will exchange the code for tokens and save them.
                        const { error } = await supabase.functions.invoke('google-calendar-auth', {
                            body: { code: response.code }
                        });

                        if (error) throw error;

                        setIsConnected(true);
                        toast.success("Calendar sync enabled successfully!");
                    } catch (err: any) {
                        console.error("Auth Exception:", err);
                        const errorMsg = err.context?.message || err.message || "Failed to link Google account."; toast.error(`Error: ${errorMsg}`);
                    } finally {
                        setIsLoading(false);
                    }
                }
            },
        });

        client.requestCode();
    }, [isGisLoaded, CLIENT_ID]);

    const disconnect = useCallback(async () => {
        if (!user) return;
        
        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('google_sync_tokens')
                .delete()
                .eq('user_id', user.id);

            if (error) throw error;
            setIsConnected(false);
            toast.success("Calendar sync disabled.");
        } catch (err) {
            toast.error("Failed to disconnect.");
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    return {
        connect,
        disconnect,
        isConnected,
        isLoading,
        isReady: isGisLoaded
    };
}


