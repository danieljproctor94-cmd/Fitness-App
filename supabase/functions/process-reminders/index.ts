import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as webpush from 'https://esm.sh/web-push'

console.log("Push Notification Processor started")

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || ''
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || ''

webpush.setVapidDetails(
  'mailto:support@fitnessapp.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
)

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

serve(async (req) => {
  try {
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    const results = []

    // --- 1. PROCESS TODO REMINDERS ---
    const { data: todos, error: todosError } = await supabase
      .from('todos')
      .select('*, profiles(display_name)')
      .eq('notify', true)
      .eq('notification_sent', false)
      .eq('completed', false)
      .lte('due_date', todayStr)

    if (todosError) throw todosError

    for (const todo of (todos || [])) {
      if (!todo.due_time) continue;

      const [h, m] = todo.due_time.split(':');
      const dueTime = new Date();
      dueTime.setHours(parseInt(h), parseInt(m), 0, 0);

      const notifyBeforeMinutes = {
        'at_time': 0,
        '5_min': 5,
        '10_min': 10,
        '15_min': 15,
        '30_min': 30,
        '1_hour': 60
      }[todo.notify_before] || 10;

      const notifyAt = new Date(dueTime.getTime() - notifyBeforeMinutes * 60000);

      if (now >= notifyAt) {
        await sendPush(todo.user_id, {
          title: `Reminder: ${todo.title}`,
          body: todo.description || 'Your task is due soon!',
          url: '/planner'
        });
        
        await supabase.from('todos').update({ notification_sent: true }).eq('id', todo.id)
        results.push({ type: 'todo', id: todo.id, status: 'sent' })
      }
    }

    // --- 2. PROCESS MINDSET REMINDERS ---
    // Fetch profiles with morning/evening reminders enabled that haven't been notified today
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, mindset_reminder_time')
      .eq('mindset_reminder_enabled', true)
      .or(`mindset_last_notified.is.null,mindset_last_notified.neq.${todayStr}`)

    if (profileError) throw profileError

    for (const profile of (profiles || [])) {
      if (!profile.mindset_reminder_time) continue;

      const [h, m] = profile.mindset_reminder_time.split(':');
      const notifyAt = new Date();
      notifyAt.setHours(parseInt(h), parseInt(m), 0, 0);

      // If current time is at or after the scheduled time
      if (now >= notifyAt) {
        // Double check if they already logged today to be smart
        const { count } = await supabase
          .from('mindset_logs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', profile.id)
          .eq('date', todayStr)

        if (count === 0) {
          await sendPush(profile.id, {
            title: "Daily Mindset Journal",
            body: "Take a moment to reflect on your day and gratitude.",
            url: "/mindset"
          });
          
          await supabase.from('profiles').update({ mindset_last_notified: todayStr }).eq('id', profile.id)
          results.push({ type: 'mindset', user_id: profile.id, status: 'sent' })
        } else {
          // Already logged, mark as notified so we don't check again today
          await supabase.from('profiles').update({ mindset_last_notified: todayStr }).eq('id', profile.id)
        }
      }
    }

    return new Response(JSON.stringify({ success: true, processedCount: results.length, details: results }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

async function sendPush(userId, payload) {
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .eq('user_id', userId)

  if (!subs) return;

  for (const sub of subs) {
    try {
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: {
          auth: sub.auth,
          p256dh: sub.p256dh
        }
      }
      await webpush.sendNotification(pushConfig, JSON.stringify(payload))
    } catch (e) {
      console.error(`Error sending push to ${userId}:`, e)
      if (e.statusCode === 410) {
        await supabase.from('push_subscriptions').delete().eq('id', sub.id)
      }
    }
  }
}