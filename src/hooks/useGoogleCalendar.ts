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
    }, [CLIENT_ID]);

    const connect = () => {
        if (!CLIENT_ID) {
            toast.error("Google Client ID not configured. Please set VITE_GOOGLE_CLIENT_ID in .env");
            return;
        }
        if (tokenClient) {
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            toast.error("Google functionality not loaded yet.");
        }
    };

    const fetchUpcomingEvents = async () => {
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
            toast.error("Failed to fetch Google Calendar events.");
        }
    };

    return { events, connect, isConnected, isReady: gapiInited && gisInited };
}
