export const APP_DOMAIN = 'app.progresssyncer.com';
export const LANDING_DOMAIN = 'progresssyncer.com';

export function isAppDomain(): boolean {
    const hostname = window.location.hostname;
    const cleanHostname = hostname.replace(/^www\./, '');

    // Check for explicit app domain or app subdomain prefix
    return cleanHostname === APP_DOMAIN ||
        cleanHostname === 'app.localhost' ||
        cleanHostname.startsWith('app.');
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
