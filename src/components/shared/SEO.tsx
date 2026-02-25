import { useEffect } from 'react';

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string;
    image?: string;
    url?: string;
    structuredData?: object;
    preloadImage?: string;
}

export function SEO({
    title,
    description,
    keywords,
    image,
    url,
    structuredData,
    preloadImage
}: SEOProps) {
    const siteTitle = "Progress Syncer";
    const fullTitle = title ? title : siteTitle;
    const defaultDescription = "Track your workouts, habits, and body measurements with Progress Syncer. Your all-in-one fitness companion.";
    const metaDescription = description || defaultDescription;
    const metaImage = image || "/og-image.jpg";
    const metaUrl = url || window.location.href;

    useEffect(() => {
        // Update Title
        document.title = fullTitle;

        // Helper to update or create meta tag
        const updateMeta = (name: string, content: string, attribute: 'name' | 'property' = 'name') => {
            let element = document.querySelector(`meta[${attribute}="${name}"]`);
            if (!element) {
                element = document.createElement('meta');
                element.setAttribute(attribute, name);
                document.head.appendChild(element);
            }
            element.setAttribute('content', content);
        };

        // Standard Meta Tags
        updateMeta('description', metaDescription);
        if (keywords) updateMeta('keywords', keywords);

        // Open Graph / Facebook
        updateMeta('og:type', 'website', 'property');
        updateMeta('og:url', metaUrl, 'property');
        updateMeta('og:title', fullTitle, 'property');
        updateMeta('og:description', metaDescription, 'property');
        updateMeta('og:image', metaImage, 'property');

        // Twitter
        updateMeta('twitter:card', 'summary_large_image', 'property');
        updateMeta('twitter:url', metaUrl, 'property');
        updateMeta('twitter:title', fullTitle, 'property');
        updateMeta('twitter:description', metaDescription, 'property');
        updateMeta('twitter:image', metaImage, 'property');

                // Structured Data (JSON-LD)
        if (structuredData) {
            let scriptElement = document.querySelector('script[type="application/ld+json"]');
            if (!scriptElement) {
                scriptElement = document.createElement('script');
                scriptElement.setAttribute('type', 'application/ld+json');
                document.head.appendChild(scriptElement);
            }
            scriptElement.textContent = JSON.stringify(structuredData);
        }

        // Preload Critical LCP Image
        if (preloadImage) {
            let preloadLink = document.querySelector(`link[rel="preload"][href="${preloadImage}"]`);
            if (!preloadLink) {
                preloadLink = document.createElement('link');
                preloadLink.setAttribute('rel', 'preload');
                preloadLink.setAttribute('as', 'image');
                preloadLink.setAttribute('href', preloadImage);
                preloadLink.setAttribute('fetchpriority', 'high');
                document.head.appendChild(preloadLink);
            }
        }

        // Cleanup function (optional, but good practice to reset if unmounted, though for a landing page usually fine)
        return () => {
            // Optional: reset to default if needed when unmounting
        };
    }, [fullTitle, metaDescription, metaImage, metaUrl, keywords]);

    return null; // This component doesn't render anything visibly
}
