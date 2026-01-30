import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { useEffect } from 'react';

export function ReloadPrompt() {
    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r);
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
    });

    useEffect(() => {
        if (needRefresh) {
            toast.info("New update available!", {
                description: "Click to update to the latest version.",
                action: {
                    label: "Refresh",
                    onClick: () => updateServiceWorker(true)
                },
                duration: Infinity, // Stay open until clicked
                onDismiss: () => setNeedRefresh(false)
            });
        }
    }, [needRefresh, updateServiceWorker, setNeedRefresh]);

    return null;
}
