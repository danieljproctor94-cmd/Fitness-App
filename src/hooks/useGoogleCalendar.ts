import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

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
    // 1. Optimistic Initialization (Lazy State)
    const [events, setEvents] = useState<GoogleEvent[]>(() => {
        try {
            const stored = localStorage.getItem('google_calendar_events');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error("Failed to parse stored events", e);
            return [];
        }
    });

    const [isConnected, setIsConnected] = useState(() => {
        try {
            const storedTokenStr = localStorage.getItem("google_access_token");
            if (storedTokenStr) {
                    const token = JSON.parse(storedTokenStr);
                    // Check validity (must have structure and not be expired)
                    if (token.access_token && token.expires_in && token.created_at) {
                        const expiry = token.created_at + (token.expires_in * 1000);
                        // 5 min buffer
                        if (Date.now() < expiry - 300000) {
                            return true;
                        }
                    }
            }
        } catch (e) {
            // console.error("Error checking optimistic token", e);
        }
        return false;
    });

    const [tokenClient, setTokenClient] = useState<any>(null);
    const [gapiInited, setGapiInited] = useState(false);
    const [gisInited, setGisInited] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // 2. Fetch Helper
    const fetchUpcomingEvents = useCallback(async (token?: any, silent = false) => {
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
            localStorage.setItem('google_calendar_events', JSON.stringify(result));
            if (!silent) toast.success(`Synced ${result.length} google events`);
        } catch (err: any) {
            if (err?.result?.error?.code === 401) {
                if (!silent) toast.error("Google session expired. Please reconnect.");
                setIsConnected(false);
                localStorage.removeItem('google_access_token');
            } else {
                if (!silent) toast.error("Failed to sync calendar.");
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 3. Initialize GAPI
    useEffect(() => {
        const loadGapi = () => {
                const initGapi = () => {
                const gapi = (window as any).gapi;
                gapi.load("client", async () => {
                    try {
                        await gapi.client.init({
                            discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
                        });
                        setGapiInited(true);
                    } catch (err) {
                        console.warn("GAPI init error:", err);
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

                        localStorage.setItem("google_access_token", JSON.stringify(token));
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
    }, [fetchUpcomingEvents]);

    // 5. Restore Session (Hydrate GAPI with token)
    useEffect(() => {
        if (gapiInited && gisInited && tokenClient) {
                const storedTokenStr = localStorage.getItem("google_access_token");
                if (storedTokenStr) {
                    try {
                        const token = JSON.parse(storedTokenStr);
                        
                        if (!token.access_token || !token.expires_in || !token.created_at) {
                            localStorage.removeItem("google_access_token");
                            setIsConnected(false); // Fix inconsistent state
                            return;
                        }

                        const now = Date.now();
                        const expiryTime = token.created_at + (token.expires_in * 1000);
                        
                        // Check if expired (with 5 min buffer)
                        if (now < expiryTime - 300000) {
                            // Token Valid - Ensure GAPI has it
                            setIsConnected(true); // Should already be true from lazy init, but reinforce
                            fetchUpcomingEvents(token, true); // Silent fetch to refresh events
                        } else {
                            // Expired
                            localStorage.removeItem("google_access_token");
                            setIsConnected(false);
                        }
                    } catch (e) {
                        localStorage.removeItem("google_access_token");
                        setIsConnected(false);
                    }
                } else {
                    // No token found (maybe user logged out in another tab?)
                    setIsConnected(false);
                }
        }
    }, [gapiInited, gisInited, tokenClient, fetchUpcomingEvents]);

    const connect = () => {
        if (!CLIENT_ID) {
            toast.error("VITE_GOOGLE_CLIENT_ID not set");
            return;
        }
        if (tokenClient) {
            tokenClient.requestAccessToken({ prompt: '' });
        } else {
            toast.error("Google services initializing...");
        }
    };

    return { 
        events, 
        connect, 
        isConnected, 
        isReady: gapiInited && gisInited, 
        isLoading
    };
}
