export const APP_DOMAIN = 'app.progresssyncer.com';
export const LANDING_DOMAIN = 'progresssyncer.com';

export function isAppDomain(): boolean {
    const hostname = window.location.hostname;
    // Keep localhost as "app" context if we are not at root path, OR distinct it.
    // Actually, for simplicity in dev:
    // localhost -> Landing
    // app.localhost -> App (requires hosts file edit)
    // BUT user might not want to edit hosts.
    // Let's stick to the plan: localhost = Landing.
    // Special dev bypass: if query param ?forceApp=true exists, or we can just rely on manual navigation for now?
    // No, cleaner: localhost is LANDING.

    return hostname === APP_DOMAIN || hostname === 'app.localhost' || hostname.startsWith('app.');
}

export function getAppUrl(path: string = '/dashboard'): string {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // In dev, we might stay on localhost but maybe strictly separate?
        // If we want to test "App" on localhost without subdomains, we might need a distinct route or just allow it.
        // For now, let's treat localhost as a hybrid: links go to same domain.
        return path;
    }

    return `${protocol}//${APP_DOMAIN}${path}`;
}

export function getLandingUrl(path: string = '/'): string {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return path;
    }

    return `${protocol}//${LANDING_DOMAIN}${path}`;
}
