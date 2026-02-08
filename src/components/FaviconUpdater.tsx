import { useEffect } from 'react';
import { useData } from '@/features/data/DataContext';

export function FaviconUpdater() {
    const { appFavicon } = useData();

    useEffect(() => {
        if (!appFavicon) return;

        const updateFavicon = (url: string) => {
            let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.getElementsByTagName('head')[0].appendChild(link);
            }
            link.href = url;

            // Also update apple-touch-icon if present
            const appleLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
            if (appleLink) {
                appleLink.href = url;
            }
        };

        updateFavicon(appFavicon);
    }, [appFavicon]);

    return null;
}
