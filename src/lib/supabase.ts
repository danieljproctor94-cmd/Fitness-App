import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mhwxdqcnlibqxeiyyuxl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1od3hkcWNubGlicXhlaXl5dXhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MTMyOTYsImV4cCI6MjA4NDk4OTI5Nn0.lRUMvDKer6xGl4h5af9E2rlKzxc1FhmNbH9osihx-14'

const cookieStorage = {
    setItem: (key: string, value: string) => {
        let domain = window.location.hostname;
        if (domain.includes('progresssyncer.com')) {
            domain = '.progresssyncer.com';
        }
        document.cookie = key + '=' + encodeURIComponent(value) + '; domain=' + domain + '; path=/; max-age=31536000; SameSite=Lax; Secure';
    },
    getItem: (key: string) => {
        const match = document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)'));
        if (match) {
            return decodeURIComponent(match[2]);
        }
        let localValue = window.localStorage.getItem(key);
        if (!localValue) {
            localValue = window.localStorage.getItem('sb-mhwxdqcnlibqxeiyyuxl-auth-token');
        }
        if (localValue) {
           cookieStorage.setItem(key, localValue);
           return localValue;
        }
        return null;
    },
    removeItem: (key: string) => {
        let domain = window.location.hostname;
        if (domain.includes('progresssyncer.com')) {
            domain = '.progresssyncer.com';
        }
        document.cookie = key + '=; domain=' + domain + '; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        window.localStorage.removeItem(key);
        window.localStorage.removeItem('sb-mhwxdqcnlibqxeiyyuxl-auth-token');
    }
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        storage: cookieStorage,
        storageKey: 'supabase-auth-token-shared',
    }
})
