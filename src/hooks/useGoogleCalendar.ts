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
    const [events, setEvents] = useState<GoogleEvent[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [tokenClient, setTokenClient] = useState<any>(null);
    const [gapiInited, setGapiInited] = useState(false);
    const [gisInited, setGisInited] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // 1. Load Stored Events immediately
    useEffect(() => {
        const storedEvents = localStorage.getItem('google_calendar_events');
        if (storedEvents) {
            try {
                setEvents(JSON.parse(storedEvents));
            } catch (e) {
                console.error("Failed to parse stored events", e);
            }
        }
    }, []);

    // 2. Fetch Events function
    const fetchUpcomingEvents = useCallback(async (token?: any, silent = false) => {
        const gapi = (window as any).gapi;
        
        // Ensure token is set if passed
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

                        // Calculate absolute expiry
                        // expires_in is in seconds
                        const token = {
                            access_token: resp.access_token,
                            expires_in: resp.expires_in,
                            created_at: Date.now()
                        };

                        // Store in localStorage
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

    // 5. Restore Session on Load
    useEffect(() => {
        if (gapiInited && gisInited && tokenClient) {
             const storedTokenStr = localStorage.getItem("google_access_token");
             if (storedTokenStr) {
                 try {
                     const token = JSON.parse(storedTokenStr);
                     
                     if (!token.access_token || !token.expires_in || !token.created_at) {
                         localStorage.removeItem("google_access_token");
                         return;
                     }

                     const now = Date.now();
                     const expiryTime = token.created_at + (token.expires_in * 1000);
                     
                     // Check if expired (with 5 min buffer)
                     if (now < expiryTime - 300000) {
                         // Still valid!
                         setIsConnected(true);
                         fetchUpcomingEvents(token, true); // Silent fetch
                     } else {
                         // Expired
                         localStorage.removeItem("google_access_token");
                         setIsConnected(false);
                     }
                 } catch (e) {
                     console.error("Token restore error", e);
                     localStorage.removeItem("google_access_token");
                 }
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
