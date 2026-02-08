import { useState, useEffect } from 'react';
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

    useEffect(() => {
        // Load Scripts
        const loadGapi = () => {
            const script = document.createElement("script");
            script.src = "https://apis.google.com/js/api.js";
            script.async = true;
            script.defer = true;
            script.onload = () => {
                (window as any).gapi.load("client", async () => {
                    await (window as any).gapi.client.init({
                        // apiKey: API_KEY, // Not strictly needed for user-data access if using OAuth token, but good practice.
                        discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
                    });
                    setGapiInited(true);

                    // Check if we have a valid token (rudimentary check, mostly rely on re-auth)
                    // Gapi client might have token if session persisted? Not reliably without user interaction or silent refresh.
                });
            };
            document.body.appendChild(script);
        };

        const loadGis = () => {
            const script = document.createElement("script");
            script.src = "https://accounts.google.com/gsi/client";
            script.async = true;
            script.defer = true;
            script.onload = () => {
                const client = (window as any).google.accounts.oauth2.initTokenClient({
                    client_id: CLIENT_ID,
                    scope: SCOPES,
                    callback: async (resp: any) => {
                        if (resp.error) {
                            console.error("GIS Error", resp);
                            toast.error("Google Sign-In failed.");
                            throw resp;
                        }
                        setIsConnected(true);
                        await fetchUpcomingEvents();
                    },
                });
                setTokenClient(client);
                setGisInited(true);
            };
            document.body.appendChild(script);
        }

        if (CLIENT_ID) {
            loadGapi();
            loadGis();
        }
    }, []);

    const connect = () => {
        if (!CLIENT_ID) {
            toast.error("Google Client ID not configured. Please set VITE_GOOGLE_CLIENT_ID in .env");
            return;
        }
        if (tokenClient) {
            // Force prompt to ensure we get a fresh token if needed, or skip if valid
            // prompt: '' will try silent, 'consent' forces. Default is usually fine.
            if ((window as any).gapi.client.getToken() === null) {
                tokenClient.requestAccessToken({ prompt: '' }); // Try silent first? or just standard
            } else {
                tokenClient.requestAccessToken({ prompt: '' });
            }
        } else {
            toast.error("Google functionality not loaded yet.");
        }
    };

    const fetchUpcomingEvents = async () => {
        setIsLoading(true);
        try {
            const response = await (window as any).gapi.client.calendar.events.list({
                'calendarId': 'primary',
                'timeMin': (new Date()).toISOString(),
                'showDeleted': false,
                'singleEvents': true,
                'maxResults': 50,
                'orderBy': 'startTime'
            });
            const result = response.result.items;
            setEvents(result);
            toast.success(`Synced ${result.length} calendar events!`);
        } catch (err: any) {
            console.error("Error fetching events", err);
            toast.error("Failed to fetch Google Calendar events. Please reconnect.");
            setIsConnected(false); // Assume token invalid
        } finally {
            setIsLoading(false);
        }
    };

    return { events, connect, isConnected, isReady: gapiInited && gisInited, isLoading };
}
