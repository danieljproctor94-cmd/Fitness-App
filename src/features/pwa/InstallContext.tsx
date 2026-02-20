import React, { createContext, useContext, useEffect, useState } from 'react';

interface PWAInstallContextType {
    isInstallable: boolean;
    installApp: () => Promise<void>;
}

const PWAInstallContext = createContext<PWAInstallContextType | undefined>(undefined);

export const PWAInstallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: any) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        // If the event fired before React mounted, we can grab it from window
        if ((window as any).globalDeferredPrompt) {
            handleBeforeInstallPrompt((window as any).globalDeferredPrompt);
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Also handle appinstalled event to reset state
        const handleAppInstalled = () => {
            setIsInstallable(false);
            setDeferredPrompt(null);
            (window as any).globalDeferredPrompt = null;
        };
        window.addEventListener('appinstalled', handleAppInstalled);

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
            setIsInstallable(false);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const installApp = async () => {
        if (!deferredPrompt) return;

        // Show the prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
            setIsInstallable(false);
            setDeferredPrompt(null);
            (window as any).globalDeferredPrompt = null;
        }  else {
            console.log('User dismissed the install prompt');
        }

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
    };

    return (
        <PWAInstallContext.Provider value={{ isInstallable, installApp }}>
            {children}
        </PWAInstallContext.Provider>
    );
};

export const usePWAInstall = () => {
    const context = useContext(PWAInstallContext);
    if (!context) {
        throw new Error('usePWAInstall must be used within a PWAInstallProvider');
    }
    return context;
};
