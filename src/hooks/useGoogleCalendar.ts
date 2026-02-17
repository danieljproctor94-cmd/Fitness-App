import { useState, useEffect, useCallback, useRef } from 'react';
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
    const { user, loading: authLoading } = useAuth();
    const userId = user?.id;

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

    // --- REFS TO BREAK CYCLES ---
    const tokenClientRef = useRef(tokenClient);
    useEffect(() => { tokenClientRef.current = tokenClient; }, [tokenClient]);

    // PRE-DEFINE fetch so it can be used below
    const fetchUpcomingEvents = useCallback(async (token?: any, silent = false) => {
        const { eventKey } = getStorageKeys();
        if (!eventKey) return;

        const gapi = (window as any).gapi;
        
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
            if (err?.result?.error?.code === 401) {
                 console.log("401 Expired. Attempting silent refresh.");
                 // Use REF to avoid dependency cycle
                 if (tokenClientRef.current) {
                     tokenClientRef.current.requestAccessToken({ prompt: 'none' });
                 }
            } else {
                if (!silent) toast.error("Failed to sync calendar.");
            }
        } finally {
            setIsLoading(false);
        }
    }, [getStorageKeys]); // Clean deps! No tokenClient.

    const fetchRef = useRef(fetchUpcomingEvents);
    useEffect(() => { fetchRef.current = fetchUpcomingEvents; }, [fetchUpcomingEvents]);

    // 1. Initial Load
    useEffect(() => {
        if (authLoading || !userId) {
            if (!authLoading) { setEvents([]); setIsConnected(false); }
            return;
        }
        console.log('useGoogleCalendar: Initializing with userId:', userId);
        const { eventKey, tokenKey } = getStorageKeys();
        if (!eventKey || !tokenKey) return;

        try {
            const storedEvents = localStorage.getItem(eventKey);
            if (storedEvents) setEvents(JSON.parse(storedEvents));
        } catch (e) { setEvents([]); }

        try {
            const storedTokenStr = localStorage.getItem(tokenKey);
            if (storedTokenStr) {
                const token = JSON.parse(storedTokenStr);
                const expiry = token.created_at + (token.expires_in * 1000);
                if (Date.now() < expiry - 300000) {
                    setIsConnected(true);
                } else {
                    // Expired -> Will be handled by Restore Effect
                    setIsConnected(false);
                }
            } else {
                setIsConnected(false);
            }
        } catch (e) {
            setIsConnected(false);
            if (tokenKey) localStorage.removeItem(tokenKey);
        }
    }, [userId, authLoading, getStorageKeys]);

    // 3. Init GAPI
    useEffect(() => {
        const loadGapi = () => {
             const initGapi = () => {
                const gapi = (window as any).gapi;
                if (gapi.client && gapi.client.calendar) {
                    setGapiInited(true); return;
                }
                gapi.load("client", async () => {
                    try {
                        await gapi.client.init({
                            discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
                        });
                        setGapiInited(true);
                    } catch (err) { setGapiInited(true); }
                });
            };
            if ((window as any).gapi) initGapi();
            else {
                const script = document.createElement("script");
                script.src = "https://apis.google.com/js/api.js";
                script.async = true; script.defer = true; script.onload = initGapi;
                document.body.appendChild(script);
            }
        };
        if (CLIENT_ID) loadGapi();
    }, []);

    // 4. Init GIS - NO FETCH DEPENDENCY in DEPS!
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
                            console.warn("Google Auth Error:", resp.error);
                            if (resp.error === 'interaction_required' || resp.error === 'popup_closed_by_user') {
                                const { tokenKey } = getStorageKeys();
                                if (tokenKey) localStorage.removeItem(tokenKey);
                                setIsConnected(false);
                            } else {
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
                        if (tokenKey) localStorage.setItem(tokenKey, JSON.stringify(token));
                        
                        setIsConnected(true);
                        // Access FETCH VIA REF to avoid dependency loop
                        if (fetchRef.current) await fetchRef.current(token, false);
                    },
                });
                setTokenClient(client);
                setGisInited(true);
            };

            if ((window as any).google?.accounts?.oauth2) initGis();
            else {
                const script = document.createElement("script");
                script.src = "https://accounts.google.com/gsi/client";
                script.async = true; script.defer = true; script.onload = initGis;
                document.body.appendChild(script);
            }
        };
        if (CLIENT_ID) loadGis();
    }, [getStorageKeys]); // Only getStorageKeys is needed.

    // 5. Restore Session
    useEffect(() => {
        if (!gapiInited || !gisInited || !tokenClient || !userId || authLoading) return;
        const { tokenKey } = getStorageKeys();
        if (!tokenKey) return;
        const storedTokenStr = localStorage.getItem(tokenKey);
        
        if (storedTokenStr) {
            try {
                const token = JSON.parse(storedTokenStr);
                const expiry = token.created_at + (token.expires_in * 1000);
                if (Date.now() < expiry - 300000) {
                     const gapi = (window as any).gapi;
                     if (gapi?.client) {
                         gapi.client.setToken(token);
                         fetchUpcomingEvents(undefined, true);
                     }
                } else {
                     console.log("Token expired, attempting strict silent refresh...");
                     tokenClient.requestAccessToken({ prompt: 'none' });
                }
            } catch (e) {
                console.error("Token restore error", e);
                localStorage.removeItem(tokenKey);
                setIsConnected(false);
            }
        }
    }, [gapiInited, gisInited, tokenClient, userId, authLoading, getStorageKeys, fetchUpcomingEvents]);

    const connect = () => {
        if (!CLIENT_ID) { toast.error("VITE_GOOGLE_CLIENT_ID not set"); return; }
        if (!userId) { toast.error("You must be logged in to sync calendar"); return; }
        if (tokenClient) tokenClient.requestAccessToken({ prompt: '' });
        else toast.error("Google services initializing...");
    };

    return { 
        events: userId ? events : [], 
        connect, 
        isConnected, 
        isReady: gapiInited && gisInited, 
        isLoading
    };
}

