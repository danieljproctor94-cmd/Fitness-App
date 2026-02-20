import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const supabaseUrl = 'https://mhwxdqcnlibqxeiyyuxl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1od3hkcWNubGlicXhlaXl5dXhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MTMyOTYsImV4cCI6MjA4NDk4OTI5Nn0.lRUMvDKer6xGl4h5af9E2rlKzxc1FhmNbH9osihx-14';

const VAPID_PUBLIC_KEY = 'BEWo0rG-3KnTBSYZO0X7IE-kHBQ44ntukW_3BxE5T1q-rZQ7bbGNHBGuOQV-laCXQtT0yw6KM5CTd3CPjdKOcZA';
const VAPID_PRIVATE_KEY = 'Js1KhV3mGvOT1cavtqUuA3Q9TVHFJvvEX6aWpBdvT_8';

webpush.setVapidDetails('mailto:support@progresssyncer.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPush() {
    const { data: subs, error } = await supabase.from('push_subscriptions').select('*').limit(1);
    if (!subs || subs.length === 0) {
        console.log('No subscriptions found!');
        return;
    }

    const sub = subs[0];
    const pushConfig = {
        endpoint: sub.endpoint,
        keys: {
            auth: sub.auth,
            p256dh: sub.p256dh
        }
    };

    try {
        await webpush.sendNotification(pushConfig, JSON.stringify({
            title: 'Diagnostic Test',
            body: 'If you see this, the cloud pipeline is fully operational!',
            tag: crypto.randomUUID(),
            url: '/'
        }));
        console.log('Push successfully sent natively through Google FCM!');
    } catch (e) {
        console.error('WebPush Error:', e);
    }
}
testPush();