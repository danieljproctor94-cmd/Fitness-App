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

    const [events, setEvents] = useState<GoogleEvent[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    const [tokenClient, setTokenClient] = useState<any>(null);
    const [gapiInited, setGapiInited] = useState(false);
    const [gisInited, setGisInited] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // 1. Initial Load & Optimistic Check
    useEffect(() => {
        if (authLoading) return; // Wait until we know who the user is

        // If no user, reset and abort
        if (!userId) {
            setEvents([]);
            setIsConnected(false);
            return;
        }

        const { eventKey, tokenKey } = getStorageKeys();
        if (!eventKey || !tokenKey) return;

        // A. Load Events
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

        // B. Load Token Status (Optimistic)
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
                        // Expired
                        setIsConnected(false);
                        localStorage.removeItem(tokenKey);
                    }
                } else {
                    setIsConnected(false);
                    localStorage.removeItem(tokenKey);
                }
            } else {
                setIsConnected(false);
            }
        } catch (e) {
            setIsConnected(false);
            if (tokenKey) localStorage.removeItem(tokenKey);
        }

    }, [userId, authLoading, getStorageKeys]);

    // 2. Fetch Helper (Defined early to be used in deps)
    const fetchUpcomingEvents = useCallback(async (token?: any, silent = false) => {
        const { eventKey, tokenKey } = getStorageKeys();
        if (!eventKey) return;

        const gapi = (window as any).gapi;
        
        // If token provided directly (e.g. fresh login), use it
        if (token) {
            if (gapi?.client) gapi.client.setToken(token);
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
            // console.error("Fetch Events Error", err);
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
                // Double check if client is already loaded to avoid errors or redundant calls
                if (gapi.client && gapi.client.calendar) {
                    setGapiInited(true);
                    return;
                }

                gapi.load("client", async () => {
                    try {
                        await gapi.client.init({
                            discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
                        });
                        setGapiInited(true);
                    } catch (err) {
                       // console.warn("GAPI Init Warning", err);
                       setGapiInited(true); // Treat as ready if it was a re-init error/warning
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

    // 4. Initialize GIS
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

                        // expires_in is seconds
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

    // 5. Restore Session (Hydrate GAPI with valid token)
    useEffect(() => {
        // Wait for EVERYTHING to be ready
        if (!gapiInited || !gisInited || !tokenClient || !userId || authLoading) return;

        const { tokenKey } = getStorageKeys();
        if (!tokenKey) return;

        const storedTokenStr = localStorage.getItem(tokenKey);
        
        if (storedTokenStr) {
            try {
                const token = JSON.parse(storedTokenStr);
                const now = Date.now();
                const expiryTime = token.created_at + (token.expires_in * 1000);

                if (now < expiryTime - 300000) {
                     // Token Valid -> Set GAPI token
                     const gapi = (window as any).gapi;
                     if (gapi?.client) {
                         gapi.client.setToken(token);
                         // Don't set isConnected here, it was done optimistically.
                         
                         // FETCH on load
                         // We do this silently to refresh the event list in case it's stale
                         fetchUpcomingEvents(undefined, true);
                     }
                } else {
                     // Token expired
                     localStorage.removeItem(tokenKey);
                     setIsConnected(false);
                }
            } catch (e) {
                localStorage.removeItem(tokenKey);
                setIsConnected(false);
            }
        }
    }, [gapiInited, gisInited, tokenClient, userId, authLoading, getStorageKeys, fetchUpcomingEvents]);

    const connect = () => {
        if (!CLIENT_ID) {
            toast.error("VITE_GOOGLE_CLIENT_ID not set");
            return;
        }
        if (!userId) {
            toast.error("You must be logged in to sync calendar");
            // Optionally redirect to login?
            return;
        }
        if (tokenClient) {
            // Use prompt: '' to try silent or 'consent' to force
            tokenClient.requestAccessToken({ prompt: '' });
        } else {
            toast.error("Google services initializing...");
        }
    };

    return { 
        events: userId ? events : [], 
        connect, 
        isConnected, 
        isReady: gapiInited && gisInited, 
        isLoading
    };
}
