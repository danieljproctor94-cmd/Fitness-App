import { useEffect, useState } from "react";
import { isAppDomain, getAppUrl } from "@/lib/domain";

interface SubdomainRouterProps {
    appRoutes: React.ReactNode;
    publicRoutes: React.ReactNode;
}

export function SubdomainRouter({ appRoutes, publicRoutes }: SubdomainRouterProps) {
    const [isApp, setIsApp] = useState(isAppDomain());

    useEffect(() => {
        const checkDomain = () => {
            const isAppCheck = isAppDomain();


            // Check if we are on the app domain
            if (isAppCheck) {
                setIsApp(true);
            } else {
                // We are on landing domain (or localhost)
                // If user tries to access a deep link meant for app (like /dashboard) while on landing domain,
                // we should probably redirect them to app domain.
                if (window.location.pathname.startsWith('/dashboard') ||
                    window.location.pathname.startsWith('/workouts') ||
                    window.location.pathname.startsWith('/planner') ||
                    window.location.pathname.startsWith('/login') ||
                    window.location.pathname.startsWith('/register')) {

                    // Allow localhost to pass through for dev, OR force redirect?
                    // For dev (localhost), we allow pass-through if they typed it manually.
                    if (window.location.hostname === 'localhost') {
                        setIsApp(true); // Treat as app if they manually went to /dashboard on localhost
                    } else {
                        // Redirect to app domain
                        window.location.href = getAppUrl(window.location.pathname);
                    }
                } else {
                    setIsApp(false);
                }
            }
        };

        checkDomain();
    }, []);

    return isApp ? <>{appRoutes}</> : <>{publicRoutes}</>;
}

