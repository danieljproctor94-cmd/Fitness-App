import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/AuthContext';

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
    const { user, loading: authLoading } = useAuth(); // Get current user
    const userId = user?.id;

    // Helper to get storage keys based on user
    const getStorageKeys = useCallback(() => {
        if (!userId) return { eventKey: null, tokenKey: null };
        return {
            eventKey: `google_calendar_events_${userId}`,
            tokenKey: `google_access_token_${userId}`
        };
    }, [userId]);

    // 1. Optimistic Initialization (Lazy State)
    // We cannot trust lazy state blindly if userId changes.
    // So we initialize empty, and rely on an effect to load data when userId is ready.
    const [events, setEvents] = useState<GoogleEvent[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    const [tokenClient, setTokenClient] = useState<any>(null);
    const [gapiInited, setGapiInited] = useState(false);
    const [gisInited, setGisInited] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Load Stored Data when User is Ready
    useEffect(() => {
        if (authLoading) return; // Wait for auth check

        if (!userId) {
            setEvents([]);
            setIsConnected(false);
            return;
        }

        const { eventKey, tokenKey } = getStorageKeys();
        if (!eventKey || !tokenKey) return;

        // Load Events
        try {
            const storedEvents = localStorage.getItem(eventKey);
            if (storedEvents) {
                setEvents(JSON.parse(storedEvents));
            } else {
                setEvents([]);
            }
        } catch (e) {
            console.error("Failed to parse stored events", e);
            setEvents([]);
        }

        // Check Token for Optimistic 'Connected' State
        try {
            const storedTokenStr = localStorage.getItem(tokenKey);
            if (storedTokenStr) {
                const token = JSON.parse(storedTokenStr);
                if (token.access_token && token.expires_in && token.created_at) {
                    const expiry = token.created_at + (token.expires_in * 1000);
                     // 5 min buffer
                    if (Date.now() < expiry - 300000) {
                        setIsConnected(true);
                    } else {
                        setIsConnected(false);
                    }
                } else {
                    setIsConnected(false);
                }
            } else {
                setIsConnected(false);
            }
        } catch (e) {
            setIsConnected(false);
        }

    }, [userId, authLoading, getStorageKeys]);

    // 2. Fetch Helper
    const fetchUpcomingEvents = useCallback(async (token?: any, silent = false) => {
        const { eventKey, tokenKey } = getStorageKeys();
        // If no user, abort
        if (!eventKey || !tokenKey) return;

        const gapi = (window as any).gapi;
        
        if (token) {
            gapi.client.setToken(token);
        } else if (!gapi?.client?.getToken()) {
            return;
        }

        setIsLoading(true);
        try {
            const response = await gapi.client.calendar.events.list({
                'calendarId': 'primary',
                'timeMin': (new Date()).toISOString(),
                'showDeleted': false,
                'singleEvents': true,
                'maxResults': 50,
                'orderBy': 'startTime'
            });
            const result = response.result.items;
            setEvents(result);
            
            localStorage.setItem(eventKey, JSON.stringify(result));
            
            if (!silent) toast.success(`Synced ${result.length} google events`);
        } catch (err: any) {
            if (err?.result?.error?.code === 401) {
                if (!silent) toast.error("Google session expired. Please reconnect.");
                setIsConnected(false);
                if (tokenKey) localStorage.removeItem(tokenKey);
            } else {
                if (!silent) toast.error("Failed to sync calendar.");
            }
        } finally {
            setIsLoading(false);
        }
    }, [getStorageKeys]);

    // 3. Initialize GAPI
    useEffect(() => {
        const loadGapi = () => {
                const initGapi = () => {
                const gapi = (window as any).gapi;
                // Avoid re-init if already done? 
                // Gapi load is idempotent but init might complain if called twice?
                // We trust the window check mostly.
                gapi.load("client", async () => {
                    try {
                        // Check if already inited? no api for that.
                        // But init calls are safe to retry usually.
                        await gapi.client.init({
                            discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
                        });
                        setGapiInited(true);
                    } catch (err) {
                        // console.warn("GAPI init error (maybe already inited):", err);
                         // If error is "gapi.client.init has already been called", we are good.
                         setGapiInited(true);
                    }
                });
            };

            if ((window as any).gapi) {
                initGapi();
            } else {
                const script = document.createElement("script");
                script.src = "https://apis.google.com/js/api.js";
                script.async = true;
                script.defer = true;
                script.onload = initGapi;
                document.body.appendChild(script);
            }
        };
        if (CLIENT_ID) loadGapi();
    }, []);

    // 4. Initialize GIS and Token Client
    useEffect(() => {
        const loadGis = () => {
            const initGis = () => {
                const google = (window as any).google;
                if (!google?.accounts?.oauth2) return;

                const client = google.accounts.oauth2.initTokenClient({
                    client_id: CLIENT_ID,
                    scope: SCOPES,
                    callback: async (resp: any) => {
                        if (resp.error) {
                            if (resp.error !== 'popup_closed_by_user') {
                                toast.error("Google Connect failed.");
                            }
                            return;
                        }

                        const token = {
                            access_token: resp.access_token,
                            expires_in: resp.expires_in,
                            created_at: Date.now()
                        };

                        const { tokenKey } = getStorageKeys();
                        if (tokenKey) {
                            localStorage.setItem(tokenKey, JSON.stringify(token));
                        }
                        
                        setIsConnected(true);
                        await fetchUpcomingEvents(token, false);
                    },
                });
                setTokenClient(client);
                setGisInited(true);
            };

            if ((window as any).google?.accounts?.oauth2) {
                initGis();
            } else {
                const script = document.createElement("script");
                script.src = "https://accounts.google.com/gsi/client";
                script.async = true;
                script.defer = true;
                script.onload = initGis;
                document.body.appendChild(script);
            }
        };
        if (CLIENT_ID) loadGis();
    }, [fetchUpcomingEvents, getStorageKeys]);

    // 5. Restore Session (Hydrate GAPI with token)
    useEffect(() => {
        const { tokenKey } = getStorageKeys();
        if (gapiInited && gisInited && tokenClient && userId && tokenKey) {
            const storedTokenStr = localStorage.getItem(tokenKey);
            if (storedTokenStr) {
                try {
                    const token = JSON.parse(storedTokenStr);
                    
                    if (!token.access_token || !token.expires_in || !token.created_at) {
                        localStorage.removeItem(tokenKey);
                        setIsConnected(false); // Fix inconsistent state
                        return;
                    }

                    const now = Date.now();
                    const expiryTime = token.created_at + (token.expires_in * 1000);
                    
                    // Check if expired (with 5 min buffer)
                    if (now < expiryTime - 300000) {
                        // Token Valid - Ensure GAPI has it
                        // Set GAPI token
                        const gapi = (window as any).gapi;
                        if (gapi?.client) {
                            gapi.client.setToken(token);
                            setIsConnected(true); 
                            fetchUpcomingEvents(undefined, true); // Use current token in GAPI
                        }
                    } else {
                        // Expired
                        localStorage.removeItem(tokenKey);
                        setIsConnected(false);
                    }
                } catch (e) {
                    localStorage.removeItem(tokenKey);
                    setIsConnected(false);
                }
            } else {
                setIsConnected(false);
            }
        }
    }, [gapiInited, gisInited, tokenClient, fetchUpcomingEvents, userId, getStorageKeys]);

    const connect = () => {
        if (!CLIENT_ID) {
            toast.error("VITE_GOOGLE_CLIENT_ID not set");
            return;
        }
        if (!userId) {
            toast.error("You must be logged in to sync calendar");
            return;
        }
        if (tokenClient) {
            tokenClient.requestAccessToken({ prompt: '' });
        } else {
            toast.error("Google services initializing...");
        }
    };

    return { 
        events: userId ? events : [], // Security fallback 
        connect, 
        isConnected, 
        isReady: gapiInited && gisInited, 
        isLoading
    };
}

