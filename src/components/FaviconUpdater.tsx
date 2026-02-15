import { useEffect } from 'react';
import { useData } from '@/features/data/DataContext';

export function FaviconUpdater() {
    const { appFavicon } = useData();

    useEffect(() => {
        if (!appFavicon) return;

        const updateFavicon = (url: string) => {
            // 1. Update Tab Icon (Favicon)
            let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.getElementsByTagName('head')[0].appendChild(link);
            }
            link.href = url;

            // 2. Update Apple Touch Icon (iOS Home Screen)
            let appleLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
            if (!appleLink) {
                appleLink = document.createElement('link');
                appleLink.rel = 'apple-touch-icon';
                document.getElementsByTagName('head')[0].appendChild(appleLink);
            }
            appleLink.href = url;

            // 3. Update PWA Manifest (Android Home Screen)
            // Dynamically create a manifest blob pointing to the user's icon
            const dynamicManifest = {
                name: 'Progress Syncer',
                short_name: 'Progress Syncer',
                description: 'Track your workouts, habits, and body measurements.',
                theme_color: '#ffffff',
                background_color: '#ffffff',
                display: 'standalone',
                start_url: '/',
                scope: '/',
                icons: [
                    {
                        src: url,
                        sizes: "192x192", 
                        type: "image/png",
                        purpose: "any maskable"
                    },
                    {
                        src: url,
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "any maskable"
                    }
                ]
            };

            const stringManifest = JSON.stringify(dynamicManifest);
            const blob = new Blob([stringManifest], { type: 'application/json' });
            const manifestURL = URL.createObjectURL(blob);

            let manifestLink = document.querySelector("link[rel='manifest']") as HTMLLinkElement;
            if (manifestLink) {
                manifestLink.href = manifestURL;
            } else {
                manifestLink = document.createElement('link');
                manifestLink.rel = 'manifest';
                manifestLink.href = manifestURL;
                document.getElementsByTagName('head')[0].appendChild(manifestLink);
            }
        };

        updateFavicon(appFavicon);
    }, [appFavicon]);

    return null;
}
